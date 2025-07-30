import { SystemEvent, Events } from '../../types/system-event.js';

export class ObjectDataSink {
    #SINK_FILE_PATH;
    #client;
    #events;
    #logger;

    /**
     * @param {Object} options
     * @param {String} options.SINK_FILE_PATH 
     * @param {Object} options.client
     * @param {Object} options.events
     * @param {Object} options.logger
     */
    constructor(options) {
        this.#SINK_FILE_PATH = options.SINK_FILE_PATH;
        this.#client = options.client;
        this.#events = options.events;
        this.#logger = options.logger;

        // Initialize existing sink data
        this.#loadSinkData(this.#SINK_FILE_PATH).catch(ex => {
            this.#logger.error('INTERNAL_(ERROR (MLService.ObjectDataSink): Exception encountered while loading sink data. See details ->', ex.message);
        });
    }

    /**
     * Stages data to a specified sink for later processing typically for model training
     * @param {Object} options
     * @param {String} options.bucketPath - JSON Pointer path to a bucket in the sink data
     * @param {Object} options.data
     * @returns {Promise<void>} 
     */
    async push({ bucketPath, data }) {
      const path = bucketPath.startsWith('/') ? bucketPath : `/${bucketPath}`;

      try {     
        // When we push data to an object bucket its going to a file 
        // so we need to push to Supabase object storage here
     
      } catch(ex) {
        this.#logger.error(`INTERNAL_ERROR (MLService.ObjectDataSink): Exception encountered while pushing data to sink (${path}). See details ->`, ex.message);
      }
    }

    /**
     * Returns a specfied bucket in the data sink
     * @param {String} bucketPath
     * @returns {Promise<Object[]>} 
     */
    async pull(bucketPath) {
      try {
        const path = bucketPath.startsWith('/') ? bucketPath : `/${bucketPath}`;
        // Here we will pull a specified file from Supabase object storage
        // and return it
      } catch (ex) {
        this.#logger.error(`INTERNAL_ERROR (MLService.ObjectDataSink): Failed to pull data from path (${bucketPath}) See details -> ${ex.message}`);
      }
    }
    
    /**
     * Loads sink data from object storage
     * @param {String} bucketPath 
     */
    async #loadSinkData(bucketPath) {
        try {
            // Here we will load data from Supabase object storage at a specified path
            setTimeout(() => {
                // enclosed in a timeout to ensure dispatch after the corresponding listener is attached
                this.#events.dispatchEvent(new SystemEvent(Events.DATA_SINK_LOADED, { bucketPath }));
            }, 0);
        } catch (ex) {
            this.#logger.error(`INTERNAL_ERROR (MLService.ObjectDataSink): Failed to load data from path (${bucketPath}) See details -> ${ex.message}`);
        }
    }
};