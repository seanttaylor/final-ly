
/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox, IEvent } from '../../interfaces.js';

/* eslint-enable no-unused-vars */

import { SystemEvent, Events } from '../../types/system-event.js';

/**
 * @typedef {object} DependentServices
 */

export class Xevents extends EventTarget {
    #logger;
    #sandbox;

    /**
     * @param {ISandbox & {my: DependentServices}} sandbox
     */
    constructor(sandbox) {
        super();
        this.#logger = sandbox.core.logger.getLoggerInstance();
        this.#sandbox = sandbox;
    }

    get status() {
        return {
            name: this.constructor.name,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * @param {CustomEvent} event
     * @param {IEvent<Object>} event.detail
     */
    dispatchEvent(event) {
        try {
            // dispatch event to registered subscribers
            super.dispatchEvent(event);

            // dispatch composite event to the event log
            // super.dispatchEvent(
            //   new SystemEvent(Events.EVENT_DISPATCHED, event.detail)
            // );
        } catch(ex) {
            this.#logger.error(`INTERNAL_ERROR (Xevents): Exception encountered during event dispatch. See details -> ${ex.message}`)
        }
    }
}