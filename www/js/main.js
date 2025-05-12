import { Sandbox } from './src/sandbox.js';
import { SystemEvent, Events } from './src/types/system-event.js';
import { core, services, providers } from './src/services.js';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox } from './src/interfaces.js';

/* eslint-enable no-unused-vars */

/******** SERVICES ********/
import { Configuration } from './src/services/config/index.js';
import { FeedService, FeedMonitor } from './src/services/feed/index.js';
import { FeedProvider} from './src/services/feed/provider/index.js';
import { NOOPService } from './src/services/noop/index.js';

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

const APP_NAME = 'current.ly';
const APP_VERSION = '0.0.1';

/******** ENSURE DESIRED SERVICES ARE DEFINED IN EITHER `services` or `providers` ********/
const MY_SERVICES = [...core, ...services, ...providers];

new Sandbox(MY_SERVICES, async function(box) {

  try {
    console.log(`${APP_NAME} v${APP_VERSION}`);
    console.log(box.my.NOOPService.status);
    console.log(box.my.FeedMonitor.status);
    console.log(box.my.Cache.status);

    const feedStrategy = box.my.FeedProvider.axios;
    box.my.FeedService.setStrategy(feedStrategy);

    box.my.Events.addEventListener(Events.FEEDS_REFRESHED, ({ detail: event }) => {
      console.log(event);
    });
  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
});


