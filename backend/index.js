import express from 'express';

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
//import { FeedService, FeedMonitor } from './src/services/feed/index.js';
//import { FeedProvider} from './src/services/feed/provider/index.js';
import { NOOPService } from './src/services/noop/index.js';

import { MemoryCache } from './src/services/cache/memory.js';
//import { PatchProvider } from './src/services/feed/provider/index.js';
import { Xevents } from './src/services/event/index.js';

Sandbox.modules.of('HTTPService', HTTPService);
Sandbox.modules.of('RouteService', RouteService);
Sandbox.modules.of('Config', Configuration);
Sandbox.modules.of('Events', Xevents);
//Sandbox.modules.of('FeedProvider', FeedProvider);
Sandbox.modules.of('Cache', MemoryCache);

//Sandbox.modules.of('FeedService', FeedService);
//Sandbox.modules.of('FeedMonitor', FeedMonitor);
Sandbox.modules.of('NOOPService', NOOPService);
//Sandbox.modules.of('PatchProvider', PatchProvider);

const APP_NAME = 'com.current.ly.backend';
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
    //console.log(box.my.PatchProvider.status);
    box.my.HTTPService.start();
  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
});