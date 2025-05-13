import { Sandbox } from './src/sandbox.js';
import { SystemEvent, Events } from './src/types/system-event.js';
import { core, services, providers } from './src/services.js';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox, IEvent } from './src/interfaces.js';

/* eslint-enable no-unused-vars */

/******** SERVICES ********/
import { Configuration } from './src/services/config/index.js';
import { FeedService, FeedMonitor } from './src/services/feed/index.js';
import { FeedProvider} from './src/services/feed/provider/index.js';
import { NOOPService } from './src/services/noop/index.js';

import { PatchProvider } from './src/services/feed/provider/index.js';
import { MemoryCache } from './src/cache/memory.js';
import { Xevents } from './src/services/event/index.js';

/******** REGISTRATION ********/
Sandbox.modules.of('Config', Configuration);
Sandbox.modules.of('Cache', MemoryCache);
Sandbox.modules.of('Events', Xevents);
Sandbox.modules.of('FeedProvider', FeedProvider);

Sandbox.modules.of('FeedService', FeedService);
Sandbox.modules.of('FeedMonitor', FeedMonitor);
Sandbox.modules.of('NOOPService', NOOPService);
Sandbox.modules.of('PatchProvider', PatchProvider);

const APP_NAME = 'current.ly';
const APP_VERSION = '0.0.1';

/******** ENSURE DESIRED SERVICES ARE DEFINED IN EITHER `services` or `providers` ********/
const MY_SERVICES = [...core, ...services, ...providers];

new Sandbox(MY_SERVICES, async function(box) {

  try {
    console.log(`${APP_NAME} v${APP_VERSION}`);
    console.log(box.my.NOOPService.status);
    //console.log(box.my.FeedMonitor.status);
    console.log(box.my.Cache.status);

    const feedStrategy = box.my.FeedProvider.axios;
    box.my.FeedService.setStrategy(feedStrategy);

    box.my.Events.addEventListener(Events.FEEDS_REFRESHED, ({ detail: event }) => {
      console.log(event);
    });

    box.my.Events.addEventListener(Events.FEED_UPDATED, onFeedUpdate);

    const request = await fetch('/api/getStatus');
    const response = await request.json();
    console.log(response);

    /**
     * Fires when a single subscribed feed has a new update
     * @param {IEvent<Object>} event
     */
    async function onFeedUpdate(event) {
      console.log(event);
      const { header, payload } = event;
      const { feedName } = payload;

      try {
        app.globals.recentlyUpdatedFeeds.add(feedName);

        if (PatchProvider[feedName]) {
          const cachedRecord = await cache.get(payload.key);
          const feed = JSON.parse(cachedRecord);

          const feedItems = feed.rss.channel.item.map((item) => {
            let patchSchema;
            try {
              if (PatchProvider[feedName]?.validator) {
                patchSchema = PatchProvider[feedName].validator(item);
              } else {
                patchSchema = PatchProvider[feedName];
              }

              let patchedItem = jsonpatch.applyPatch(
                item,
                patchSchema
              ).newDocument;

              return patchedItem;
            } catch (ex) {
              console.error(ex.message);
            }
          });

          const canonicalizedFeed = {
            feed: feedName,
            items: feedItems,
          };

          console.log({ canonicalizedFeed });

          await cache.set(
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


