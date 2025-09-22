import jsonpatch from 'fast-json-patch';
import { json2csv } from 'json-2-csv'; 

import { Sandbox } from './src/sandbox.js';
import { SystemEvent, Events } from './src/types/system-event.js';
import { core, services, providers } from './src/services.js';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox, IEvent } from './src/interfaces.js';

/* eslint-enable no-unused-vars */

/******** SERVICES ********/
import { Configuration } from './src/services/config/index.js';
import { HTTPService } from './src/services/http.js';
import { RouteService } from './src/services/routers/index.js';
import { FeedService, FeedMonitor } from './src/services/feed/index.js';

import { FeedProvider} from './src/services/feed/provider/index.js';
//import { MemoryCache } from './src/services/cache/memory.js';
import { Upstash } from './src/services/cache/upstash.js';
import { NOOPService } from './src/services/noop/index.js';
import { PatchProvider } from './src/services/feed/provider/index.js';

import { Database } from './src/services/db/index.js';
import { MLService } from './src/services/ml/index.js';
import { UtilityService } from './src/services/utils.js';
import { Xevents } from './src/services/event/index.js';

import { SubscriptionService } from './src/services/subscription/index.js';
import { UserService } from './src/services/user/index.js';
import { MiddlewareProvider } from './src/services/middleware/index.js';

Sandbox.modules.of('HTTPService', HTTPService);
Sandbox.modules.of('RouteService', RouteService);
Sandbox.modules.of('Config', Configuration);
Sandbox.modules.of('Events', Xevents);

Sandbox.modules.of('FeedProvider', FeedProvider);
Sandbox.modules.of('Cache', Upstash);
Sandbox.modules.of('FeedService', FeedService);
Sandbox.modules.of('FeedMonitor', FeedMonitor);

Sandbox.modules.of('MLService', MLService);
Sandbox.modules.of('NOOPService', NOOPService);
Sandbox.modules.of('PatchProvider', PatchProvider);
Sandbox.modules.of('UtilityService', UtilityService);

Sandbox.modules.of('Database', Database);
Sandbox.modules.of('SubscriptionService', SubscriptionService);
Sandbox.modules.of('UserService', UserService);
Sandbox.modules.of('MiddlewareProvider', MiddlewareProvider);

const APP_NAME = 'com.current.ly.backend';
const APP_VERSION = '0.0.1';
const GLOBALS = {
  recentlyUpdatedFeeds: new Set(),
};

/******** ENSURE DESIRED SERVICES ARE DEFINED IN EITHER `services` or `providers` ********/
const MY_SERVICES = [...core, ...services, ...providers];

new Sandbox(MY_SERVICES, async function(/** @type {ISandbox} **/box) {
  try {
    console.log(`${APP_NAME} v${APP_VERSION}`);
    bootstrapStartupServices();
    
    box.my.Events.addEventListener(Events.FEEDS_REFRESHED, wrapAsyncEventHandler(onFeedsRefreshed));
    box.my.Events.addEventListener(Events.FEED_UPDATED, wrapAsyncEventHandler(onFeedUpdate));
    box.my.Events.addEventListener(Events.DATA_SINK_LABELING_VALIDATED, wrapAsyncEventHandler(onLabelingValidated));
    
    box.my.Events.addEventListener(Events.DATA_SINK_LOADED, logEvent);
    box.my.Events.addEventListener(Events.PIPELINE_FINISHED, logEvent);
    box.my.Events.addEventListener(Events.TRAINING_DATA_UPLOADED, logEvent);
    
    box.my.HTTPService.start(); 

    function logEvent({ detail: event }) {
      console.log(event);
    }

    /**
     * Bootstraps specific services at startup to ensure their APIs are available to the application when needed
     * @param {Object[]} services - services which *REQUIRE* a manual start by the application
     */
    function bootstrapStartupServices(services) {
      const activeServices = [
        { ...box.my.Config.status },
        { ...box.my.NOOPService.status },
        { ...box.my.FeedMonitor.status },
        { ...box.my.MLService.status },
        { ...box.my.Database.status }
      ];
      console.table(activeServices, ['name', 'timestamp']);
    }

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
     * Fires when all staged training data items have been validated (i.e. all have valid labels)
     * and are ready to be pushed to object storage
     * @param {IEvent<Object>} event
     */
    async function onLabelingValidated(event) {
      console.log(event);
      const { payload: { bucket } } = event;

      try {
        // We won't do training in this service; instead we'll just convert training data to a CSV and then push to storage bucket
        const labeledSinkData = await box.my.MLService.DataSink.pull(bucket);
        const CSV_SINK_DATA = json2csv(labeledSinkData);
        await box.my.MLService.RemoteDataSink.push({ file: new File([CSV_SINK_DATA], 'feed-categorization-training-data.csv', { type: 'text/csv' }) });

      } catch(ex) {
        console.error(`INTERNAL_ERROR (Main): Exception encountered while pushing labeled data to object storage. See details -> ${ex.message}`);
      }
    }

    /**
     * Fires when a single subscribed feed has a new update
     * @param {IEvent<Object>} event
     */
    async function onFeedUpdate(event) {
      //console.log(event);
      const { header, payload } = event;
      const { feedName } = payload;

      try {
        GLOBALS.recentlyUpdatedFeeds.add(feedName);
        // what happens if `cachedRecord` is undefined?
        // it *SHOULDN'T* be undefined because the `payload.key` is the feed that was cached before the `FEED_UPDATED` event fires
        if (box.my.PatchProvider[feedName]) {
          const feed = await box.my.Cache.get(payload.key);
          //const feed = Object.assign({}, JSON.parse(cachedRecord));
          
          const feedItems = feed.rss.channel.item.map((item) => {
            let patchSchema;
            try {
              if (box.my.PatchProvider[feedName]?.validator) {
                patchSchema = box.my.PatchProvider[feedName].validator(item);
              } else {
                patchSchema = box.my.PatchProvider[feedName];
              }
              let patchedItem = jsonpatch.applyPatch(
                Object.assign({}, item),
                patchSchema,
              ).newDocument;

              return patchedItem;
            } catch (ex) {
              console.error(`INTERNAL_ERROR (Main): Exception encountered while patching feed item in (${feedName}) feed. **ENSURE A JSON PATCH SPEC IS AVAILABLE** for this feed in PatchProvider. See details -> ${ex.message}`
              );
              return;
            }
          }).map((item) => {
            if (box.my.PatchProvider.PostPatch[feedName]) {
              return box.my.PatchProvider.PostPatch[feedName](structuredClone(item));
            }
            return item;
          });

          const canonicalizedFeed = {
            feed: feedName,
            items: feedItems,
          };

          const categorizedFeed = await categorizeFeed(canonicalizedFeed.items);

          await box.my.Cache.set({
            key: `feed.${feedName}.canonical`,
            value: JSON.stringify({ feed: feedName, items: categorizedFeed }),
          });

          //await box.my.MLService.DataSink.push({ bucketPath: 'training/raw/feeds', data: canonicalizedFeed });
          return;
        }
        console.info(
          `INFO (Main): No JSON Patch spec available found for feed (${feedName}). Skipping patch application for this feed.`
        );
      } catch (ex) {
        console.error(
          `INTERNAL_ERROR (Main): Exception encountered while processing feed update (${feedName}) ENSURE APPROPRIATE CORS CONFIGURATION for calls to RSS feed endpoints. This is the **MOST COMMON REASON** for this exception. See details -> ${ex.message}`
        );
      }
    }

    /**
     * Uses the ML model for text classification to classify each feed item as specific news category
     * @param {Object} feedList - list of feeds fetched from the cache
     * @returns {Promise<Object[]>}
     */
    async function categorizeFeed(feedList) {
      const categorizedFeed = feedList.map(async (item) => {
        const category = await box.my.MLService.Classification.classify(item);
        return Object.assign(item, { category: [category] });
      }); 

      return Promise.all(categorizedFeed);
    }

    /**
     * Fires when all subscribed feed updates have been completed or atttempted
     * @param {IEvent<Object>} event
     */
    async function onFeedsRefreshed(event) {
      setTimeout(async () => {
        console.log(event);
        
        try {
          const updatedFeedNames = (await box.my.Cache.keys()).filter((k) => k.includes('canonical'));
          const updatedFeeds = updatedFeedNames.map(async (key) => {
            return (await box.my.Cache.get(key));
          });
    
          const feedList = await Promise.all(updatedFeeds);      
          //console.log({feedList});
  
          // do all the post-processing of feeds
          // sorting, scoring, ranking, summarizing, etc.
  
        } catch(ex) {
          console.error(`INTERNAL_ERROR (Main): Exception encountered while refreshing feeds. See details -> ${ex.message}`);
        }
      }, 0);
    }
  
  } catch(ex) {
    console.error(`INTERNAL_ERROR (Main): Exception encountered during startup. See details -> ${ex.message}`);
  }
});