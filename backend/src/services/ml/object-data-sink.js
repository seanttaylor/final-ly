import { SystemEvent, Events } from '../../types/system-event.js';

export class ObjectDataSink {
    #SINK_BUCKET_NAME;
    #SINK_FILE_PATH;
    #client;
    #events;
    #logger;

    /**
     * @param {Object} options
     * @param {String} options.SINK_BUCKET_NAME
     * @param {String} options.SINK_FILE_PATH 
     * @param {Object} options.client
     * @param {Object} options.events
     * @param {Object} options.logger
     */
    constructor(options) {
      this.#SINK_FILE_PATH = options.SINK_FILE_PATH;
      this.#SINK_BUCKET_NAME = options.SINK_BUCKET_NAME;
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
     * @param {File} options.file
     * @returns {Promise<void>} 
     */
    async push({ file }) {
      try {     
        const path = this.#SINK_FILE_PATH.startsWith('/') ? this.#SINK_FILE_PATH : `/${this.#SINK_FILE_PATH }`;
        const { error } = await this.#client.storage.from(this.#SINK_BUCKET_NAME).upload(`${path}/${file.name}`, file, {
          contentType: 'text/csv',
          upsert: true      
        });

        if (error) {
          this.#logger.error(`INTERNAL_ERROR (MLService.ObjectDataSink): Could not upload file to data sink (${path}). See details ->`, error.message);
        }

        this.#events.dispatchEvent(new SystemEvent(Events.TRAINING_DATA_UPLOADED, {
          bucket: this.#SINK_BUCKET_NAME,
          bucketPath: this.#SINK_FILE_PATH
        },
        {
          rel: 'ready_for_training',
        }
      ))
     
      } catch(ex) {
        this.#logger.error(`INTERNAL_ERROR (MLService.ObjectDataSink): Exception encountered while uploading file to data sink (${this.#SINK_FILE_PATH}). See details ->`, ex.message);
      }
    }

    /**
     * Returns a specfied bucket in the data sink
     * @returns {Promise<Object[]>} 
     */
    async pull() {
      try {
        const path = this.#SINK_FILE_PATH.startsWith('/') ? this.#SINK_FILE_PATH : `/${this.#SINK_FILE_PATH }`;
        // Here we will pull a specified file from Supabase object storage
        // and return it 
        // Likely we won't need pull capability just yet since the training data sink is
        // push only where the backend is concerned
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
            // This is technically a noop, as we don't need to eagerly load the objects 
            // in object storage like we do with a local JSON file data sink.
            setTimeout(() => {
                // enclosed in a timeout to ensure dispatch after the corresponding listener is attached
                this.#events.dispatchEvent(new SystemEvent(Events.DATA_SINK_LOADED, {
                  bucketName: this.#SINK_BUCKET_NAME,
                  bucketPath,
                }));
            }, 0);
        } catch (ex) {
            this.#logger.error(`INTERNAL_ERROR (MLService.ObjectDataSink): Failed to load data from path (${bucketPath}) See details -> ${ex.message}`);
        }
    }
};