import { ApplicationService } from '../../types/application.js';
import { SystemEvent, Events } from '../../types/system-event.js';

/**
 * This service is just used as a sanity check to ensure the module system is working
 */
export class MLService extends ApplicationService {
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();

    this.DataSink = {
        /**
         * Stages data to a specified sink for later processing typically for model training
         * @param {Object} options
         * @param {String} options.bucket - identifier for a data sink
         * @param {Object} options.data
         * @returns {Promise<void>} 
         */
        async push({ bucket, data }) {
            console.log(`Pushing data to bucket ${bucket}`);
            console.log({ bucket, data });
        }   
    };
  }
  
}