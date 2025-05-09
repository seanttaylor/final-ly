import { Sandbox } from './src/sandbox.js';
import { SystemEvent, Events } from './src/types/system-event.js';
import { core, services, providers } from './src/services.js';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox } from './src/interfaces.js';

/* eslint-enable no-unused-vars */

/******** SERVICES ********/
import { NOOPService } from './src/services/noop/index.js';

/******** REGISTRATION ********/
Sandbox.modules.of('NOOPService', NOOPService);

const APP_NAME = 'current.ly';
const APP_VERSION = '0.0.1';

/******** ENSURE DESIRED SERVICES ARE DEFINED IN EITHER `services` or `providers` ********/
const MY_SERVICES = [...core, ...services, ...providers];

new Sandbox(MY_SERVICES, async function(box) {

  try {
    console.log(`${APP_NAME} v${APP_VERSION}`);
    console.log(box.my.NOOPService.status);
  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
});


