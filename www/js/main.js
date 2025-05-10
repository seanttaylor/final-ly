import { Sandbox } from './src/sandbox.js';
import { SystemEvent, Events } from './src/types/system-event.js';
import { core, services, providers } from './src/services.js';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox } from './src/interfaces.js';

/* eslint-enable no-unused-vars */

/******** SERVICES ********/
import { Configuration } from './src/services/config/index.js';
import { NOOPService } from './src/services/noop/index.js';
import { FeedService } from './src/services/feed/index.js';
import { FeedProvider} from './src/services/feed/provider/index.js';

/******** REGISTRATION ********/
Sandbox.modules.of('NOOPService', NOOPService);
Sandbox.modules.of('FeedService', FeedService);
Sandbox.modules.of('FeedProvider', FeedProvider);
Sandbox.modules.of('Config', Configuration);

const APP_NAME = 'current.ly';
const APP_VERSION = '0.0.1';

/******** ENSURE DESIRED SERVICES ARE DEFINED IN EITHER `services` or `providers` ********/
const MY_SERVICES = [...core, ...services, ...providers];

new Sandbox(MY_SERVICES, async function(box) {

  try {
    console.log(`${APP_NAME} v${APP_VERSION}`);
    console.log(box.my.NOOPService.status);

    const feedStrategy = box.my.FeedProvider.axios;
    box.my.FeedService.setStrategy(feedStrategy);
    
    const feed = await box.my.FeedService.getFeed();
    console.log({ feed });
  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
});


