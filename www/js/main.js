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
import { NOOPService } from './src/services/noop/index.js';

import { MemoryCache } from './src/cache/memory.js';
import { UIComponentProvider } from './src/services/component/index.js';
import { Xevents } from './src/services/event/index.js';


/******** REGISTRATION ********/
Sandbox.modules.of('Config', Configuration);
Sandbox.modules.of('Events', Xevents);
Sandbox.modules.of('Cache', MemoryCache);

Sandbox.modules.of('FeedService', FeedService);
Sandbox.modules.of('FeedMonitor', FeedMonitor);
Sandbox.modules.of('NOOPService', NOOPService);

Sandbox.modules.of('UIComponentProvider', UIComponentProvider)

const APP_NAME = 'com.current.ly.frontend';
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
    console.log(box.my.UIComponentProvider.status);

    box.my.Events.addEventListener(Events.FEED_REFRESHED, wrapAsyncEventHandler(onFeedRefreshed));
    box.my.Events.addEventListener(Events.FEED_COMPONENT_INITIALIZED, wrapAsyncEventHandler(onFeedInitialized));

    // setTimeout(() => {
    //   box.my.Events.dispatchEvent(new SystemEvent(Events.FEED_REFRESHED, {}))
    // }, 5000);

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
    async function onFeedRefreshed(event) {
      console.log(event);
      const { etag, feed } = event.payload;
      
      await box.my.Cache.set({ key: 'com.current.ly.feed', value: JSON.stringify(feed) });
      await box.my.Cache.set({ key: 'com.current.ly.feed.etag', value: etag });
      box.my.UIComponentProvider.Feed.onComponentUpdate(feed);
    }

    /**
     * Fires when a currently-feed component has been initialized in the DOM
     * @param {IEvent<Object>} event
     */
    function onFeedInitialized(event) {
      console.log(box.my.FeedMonitor.status);
      console.log(event);
    }

  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
});


