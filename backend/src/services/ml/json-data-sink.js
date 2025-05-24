import { promises as fs } from 'fs';
import JSONPointer from 'json-pointer';
import { SystemEvent, Events } from '../../types/system-event.js';

export class JSONDataSink {
    #SINK_FILE_PATH;
    #events;
    #logger;
    #sinkData = {}; 

    /**
     * @param {Object} options
     * @param {String} options.SINK_FILE_PATH 
     * @param {Object} options.logger
     * @param {Object} options.events
     */
    constructor(options) {
        this.#SINK_FILE_PATH = options.SINK_FILE_PATH;
        this.#logger = options.logger;
        this.#events = options.events;

         // Initialize existing sink data
        this.#loadSinkData().catch(ex => {
            this.#logger.error('INTERNAL_(ERROR (MLService): Exception encountered while loading sink data. See details ->', ex.message);
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
        // Get current bucket at path or create new one
        let bucket = JSONPointer.get(this.#sinkData, path);
        if (!Array.isArray(bucket)) {
          // Path doesn't exist or isn't an array - create new array
          bucket = [];
          JSONPointer.set(this.#sinkData, path, bucket);
        }
    
        bucket.push(...data.items);

        await fs.writeFile(
          this.#SINK_FILE_PATH,
          JSON.stringify(this.#sinkData, null, 2),
          'utf-8'
        );
      } catch(ex) {
        this.#logger.error(`INTERNAL_ERROR (MLService.DataSink): Exception encountered while pushing data to sink (${path}). See details ->`, ex.message);
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
        const result = JSONPointer.get(this.#sinkData, path);
        return result;
      } catch (ex) {
        this.#logger.error(`INTERNAL_ERROR (MLService.DataSink): Failed to pull data from path (${bucketPath}) See details -> ${ex.message}`);
      }
    }
    
    /**
     * Loads sink data from file
     */
    async #loadSinkData() {
        try {
        const data = await fs.readFile(this.#SINK_FILE_PATH, 'utf-8');
        this.#sinkData = JSON.parse(data);
        this.#events.dispatchEvent(new SystemEvent(Events.DATA_SINK_LOADED));
        } catch (ex) {
            if (ex.code === 'ENOENT') {
                this.#logger.warn(`WARNING (MLService.DataSink): Sink file not found at path (${this.#SINK_FILE_PATH})`);
            } else {
                throw ex;
            }
        }
    }
};