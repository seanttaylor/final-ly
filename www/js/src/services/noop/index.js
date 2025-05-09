import { SystemEvent, Events } from '../../types/system-event.js';

/**
 * This service is just used as a sanity check to ensure the module system is working
 */
export class NOOPService {
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
  }

  get status() {
    return {
        name: this.constructor.name,
        timestamp: new Date().toISOString()
    }
  }
}