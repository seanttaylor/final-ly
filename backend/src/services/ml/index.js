import { CronJob } from 'cron';
import path from 'path';
import { stripHtml } from 'string-strip-html';

import { ApplicationService } from '../../types/application.js';
import { JSONDataSink } from './json-data-sink.js';
import { ObjectDataSink } from './object-data-sink.js';
import { SystemEvent, Events } from '../../types/system-event.js';
import { SinkValidationProvider } from './sink-validation-provider.js';

/**
 * 
 */
export class MLService extends ApplicationService {
  #dbClient;
  #events;
  #logger;
  #sandbox;
  #LAST_INDEX_PROCESSED = 0;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#events = sandbox.my.Events;
    this.#logger = sandbox.core.logger.getLoggerInstance(); 
    this.#dbClient = sandbox.my.Database.getClient();  
    
    const SINK_FILE_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), 'sink.json');
    const OBJECT_DATA_SINK_BUCKET_NAME = sandbox.my.Config.vars.OBJECT_DATA_SINK_BUCKET_NAME;
    const OBJECT_DATA_SINK_FEEDS_PATH = sandbox.my.Config.vars.OBJECT_DATA_SINK_FEEDS_PATH;

    this.DataSink = new JSONDataSink({
      SINK_FILE_PATH,
      events: this.#events,
      logger: this.#logger,
    });

    this.RemoteDataSink = new ObjectDataSink({
      SINK_BUCKET_NAME: OBJECT_DATA_SINK_BUCKET_NAME,
      SINK_FILE_PATH: OBJECT_DATA_SINK_FEEDS_PATH,
      client: this.#dbClient,
      events: this.#events,
      logger: this.#logger,
    });

    const EVERY_24_HRS = '*/5 * * * *';
    const EVERY_36_HRS = '*/7 * * * *';

    // CronJob.from({
    //   cronTime: EVERY_24_HRS,
    //   onTick: this.#onScheduledDataPull.bind(this),
    //   start: true,
    //   timeZone: 'America/Los_Angeles',
    // });

    CronJob.from({
      cronTime: EVERY_36_HRS,
      onTick: this.#onScheduledLabelValidation.bind(this),
      start: true,
      timeZone: 'America/Los_Angeles',
    });
  }

  /**
   * Pulls raw data from the data sink 
   */
  async #onScheduledDataPull() {
    try {
      // NEED TO LABEL **BEFORE** VECTORIZING
      // LET VECTORIZING HAPPEN JUST BEFORE TRAINING
      const rawData = (await this.DataSink.pull('/training/raw/feeds')).slice(this.#LAST_INDEX_PROCESSED)
      const preProcessingPipeline = new this.#sandbox.my.UtilityService.SyncPipeline([
        (feedItem) => this.#stripHTML(feedItem.description),
        (text) => this.#summarize({ text }),
        (text) => text.toLowerCase(),
        this.#createTrainingInput
      ]);

      const trainingData = rawData.map(i => preProcessingPipeline.run(i));
      this.#LAST_INDEX_PROCESSED = trainingData.length;

      await this.DataSink.push({ bucketPath: '/training/label_required/feeds', data: { items: trainingData }});
      this.#events.dispatchEvent(new SystemEvent(Events.PIPELINE_FINISHED, {
        name: 'feed_categorization_preprocessing',
        bucket: '/training/label_required/feeds'
      }, 
      {        
        rel: 'ready_for_labeling',
      }));
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (MlService): Exception encountered during scheduled data pull. See details -> ${ex.message}`);
    }
  }

  /**
   * Ensures any data in the `label_required` data sink has been appropriately labeled
   */
  async #onScheduledLabelValidation() {
    try {
      const labelRequiredData = await this.DataSink.pull('/training/label_required');

      Object.entries(labelRequiredData).forEach(([sinkName, sink]) => {
        const [valid, errors] = SinkValidationProvider.label_required[sinkName].validate(sink);
        if (!valid) {
          this.#logger.error(errors);
          throw new Error(`Validation failure on training item in (/training/label_required/${sinkName}) data sink. Ensure all data in the label_required sink is labeled and valid per the schema. See any additional errors above.`);
        }
        this.#events.dispatchEvent(new SystemEvent(Events.DATA_SINK_LABELING_VALIDATED, {
            bucket: `/training/label_required/${sinkName}`
          },
          {
            rel: 'ready_for_upload',
            description: 'Indicates the *local* file data sink containing the validated and labeled training data to be pushed to object storage'
          }
        ))
      });
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (MlService): Exception encountered during scheduled label validation. See details -> ${ex.message}`);
    }
  }

  /**
   * Takes a raw feed item and produces a structured training input for
   * a ML training job
   * @param {String} text 
   * @returns {Object}
   */
  #createTrainingInput(text) {
    return {
      text,
      label: null
    }
  }

  /**
   * Starts a ML training job
   * @param {String} bucketName - the data sink bucket from which to pull *labeled* training data 
   * @returns {Object}
   */
  train({ bucketName }) {
    const options = {
      task: 'classification',
      debug: true,
      inputs: 100,
      outputs: ['label'],
    };

    ml5.setBackend('cpu'); // Or 'webgl' for GPU fallback

    ml5.neuralNetwork(options, once(this.#onBootstrapNeuralNet));

    this.#logger.log(`INFO (MLService): ML training in progress on bucket (${bucketName})`);
  }

  /**
   * @param {Object} nn
   */
  #onBootstrapNeuralNet(nn) {
    this.#logger.log('NEURAL NETWORK INITIALIZED', nn);
  }

  /**
   * Creates a vector embedding for the training process
   * @param {String} text 
   * @param {Number} size 
   * @returns {Number[]}
   */
  #createVectorEmbedding(text, size = 100) {
    const vector = Array(size).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      vector[i % size] += charCode / 255; // normalize ASCII
    }
    return vector;
  }

  /**
   * Cleans an HTML string of all HTML tags
   * @param {String} data - an HTML string
   * @returns {String}
   */
  #stripHTML(data) {
    return stripHtml(data).result;
  }

  /**
   * Extracts a specified number of words or sentences from a input string
   * @param {Object} options
   * @param {String} options.boundary
   * @param {Number} options.size
   * @param {String} options.text
   * @returns {String}
   */
  #summarize({ boundary = 'sentence', size = 5, text = '' }) {
    //console.log(text)
    if (boundary === 'word') {
      return text
        .split(/\s+/) // split by whitespace
        .slice(0, size)
        .join(' ')
        .trim();
    }

    if (boundary === 'sentence') {
      return (
        text
          .match(/[^.!?]+[.!?]+[\])'"`’”]*\s*/g) // sentence boundary regex
          ?.slice(0, size)
          .join(' ')
          .trim() || ''
      );
    }

    throw new Error(
      "INTERNAL_ERROR: Cannot summarize. See details -> boundary argument MUST be 'word' or 'sentence'"
    );
  }
  
}