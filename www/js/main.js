import { Sandbox } from './src/sandbox.js';
import { SystemEvent, Events } from './src/types/system-event.js';
import { core, services, providers } from './src/services.js';
import * as jsonpatch from 'https://esm.sh/fast-json-patch@latest';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox, IEvent } from './src/interfaces.js';

/* eslint-enable no-unused-vars */

/******** SERVICES ********/
import { Configuration } from './src/services/config/index.js';
import { FeedService, FeedMonitor } from './src/services/feed/index.js';
import { FeedProvider} from './src/services/feed/provider/index.js';
import { NOOPService } from './src/services/noop/index.js';

import { MemoryCache } from './src/cache/memory.js';
import { PatchProvider } from './src/services/feed/provider/index.js';
import { UIComponentProvider } from './src/services/component/index.js';
import { Xevents } from './src/services/event/index.js';


/******** REGISTRATION ********/
Sandbox.modules.of('Config', Configuration);
Sandbox.modules.of('Events', Xevents);
Sandbox.modules.of('FeedProvider', FeedProvider);
Sandbox.modules.of('Cache', MemoryCache);

Sandbox.modules.of('FeedService', FeedService);
Sandbox.modules.of('FeedMonitor', FeedMonitor);
Sandbox.modules.of('NOOPService', NOOPService);
Sandbox.modules.of('PatchProvider', PatchProvider);

Sandbox.modules.of('UIComponentProvider', UIComponentProvider)

const APP_NAME = 'current.ly';
const APP_VERSION = '0.0.1';
const GLOBALS = {
  recentlyUpdatedFeeds: new Set(),
};

/******** ENSURE DESIRED SERVICES ARE DEFINED IN EITHER `services` or `providers` ********/
const MY_SERVICES = [...core, ...services, ...providers];

new Sandbox(MY_SERVICES, async function(box) {

  try {
    console.log(`${APP_NAME} v${APP_VERSION}`);
    console.log(box.my.NOOPService.status);
    //console.log(box.my.FeedMonitor.status);
    console.log(box.my.PatchProvider.status)
    console.log(box.my.Cache.status);

    const feedStrategy = box.my.FeedProvider.axios;
    box.my.FeedService.setStrategy(feedStrategy);

    box.my.Events.addEventListener(Events.FEEDS_REFRESHED, wrapAsyncEventHandler(onFeedsRefreshed));
    box.my.Events.addEventListener(Events.FEED_UPDATED, wrapAsyncEventHandler(onFeedUpdate));

    setTimeout(() => {
      box.my.Events.dispatchEvent(new SystemEvent(Events.FEEDS_REFRESHED, {}))
    }, 5000);

    // const request = await fetch('/api/getStatus'); 
    // const response = await request.json();
    // console.log(response);

    /**
     * Wraps async functions used as handlers for an
     * `EventTarget` instance; ensures any thrown exceptions are
     * caught by the main application
     * @param {Function} fn
     * @returns {Function}
     */
    function wrapAsyncEventHandler(fn) {
      return async function ({ detail: event }) {
        try {
          await fn(event);
        } catch (ex) {
          console.error(
            `INTERNAL_ERROR (Main): Exception encountered during async event handler (${fn.name}) See details -> ${ex.message}`
          );
        }
      };
    }

    /**
     * Fires when all subscribed feed updates have been completed or atttempted
     * @param {IEvent<Object>} event
     */
    async function onFeedsRefreshed(event) {
      console.log(event);
      // get recently updated canonicalized feeds
      const updatedFeedNames = box.my.Cache.keys().filter((k) => k.includes('canonical'));
      const updatedFeeds = updatedFeedNames.map(async (key) => {
        return JSON.parse(await box.my.Cache.get(key));
      });

      const feedList = await Promise.all(updatedFeeds);      
      box.my.UIComponentProvider.Feed.onComponentUpdate(feedList);

      // do all the post-processing of feeds
      // scoring, ranking, summarizing, etc.
    }

    /**
     * Fires when a single subscribed feed has a new update
     * @param {IEvent<Object>} event
     */
    async function onFeedUpdate(event) {
      console.log(event);
      const { header, payload } = event;
      const { feedName } = payload;

      try {
        GLOBALS.recentlyUpdatedFeeds.add(feedName);
        // what happens if `cachedRecord` is undefined?
        // it *SHOULDN'T* be undefined because the `payload.key` is the feed that was cached before the `FEED_UPDATED` event fires
        if (box.my.PatchProvider[feedName]) {
          const cachedRecord = await box.my.Cache.get(payload.key);
          const feed = JSON.parse(cachedRecord);

          const feedItems = feed.rss.channel.item.map((item) => {
            let patchSchema;
            try {
              if (box.my.PatchProvider[feedName]?.validator) {
                patchSchema = box.my.PatchProvider[feedName].validator(item);
              } else {
                patchSchema = box.my.PatchProvider[feedName];
              }

              let patchedItem = jsonpatch.applyPatch(
                item,
                patchSchema
              ).newDocument;

              return patchedItem;
            } catch (ex) {
              console.error(`INTERNAL_ERROR (Main): Exception encountered while patching feed item in (${feedName}) feed. See details -> ${ex.message}`
              );
              return;
            }
          });

          const canonicalizedFeed = {
            feed: feedName,
            items: feedItems,
          };

         //console.log({ canonicalizedFeed });

          await box.my.Cache.set(
            `feed.${feedName}.canonical`,
            JSON.stringify(canonicalizedFeed)
          );

          return;
        }
        console.info(
          `INFO (Main): No JSON Patch spec available found for feed (${feedName}). Skipping patch application for this feed.`
        );
      } catch (ex) {
        console.error(
          `INTERNAL_ERROR (Main): Exception encountered while processing feed update (${feedName}) See details -> ${ex.message}`
        );
      }
    }

  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
});


