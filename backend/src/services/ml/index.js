import path from 'path';
import { CronJob } from 'cron';
import { stripHtml } from 'string-strip-html';
import { pipeline } from '@huggingface/transformers';

import { ApplicationService } from '../../types/application.js';
import { JSONDataSink } from './json-data-sink.js';
import { ObjectDataSink } from './object-data-sink.js';
import { SystemEvent, Events } from '../../types/system-event.js';

import { SinkValidationProvider } from './sink-validation-provider.js';
import { ML_TASKS } from '../../types/ml-task.js';

const modelMap = { [ML_TASKS.FEED_CATEGORIZATION]: 'seanttaylor/autotrain-6tl3q-3gl0i' };

/**
 * 
 */
export class MLService extends ApplicationService {
  #dbClient;
  #events;
  #logger;
  #sandbox;

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
    const EVERY_36_HRS = '*/6 * * * *';

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

  Classification = {
    /**
     * @param {String} taskType - name of the task associated with the classification query
     * @param {Object} item - a feed item to classify
     * @returns {Promise<Object>}
     */
    async classify(taskType, item) {
      //const pipe = pipeline('text-classification', modelMap[taskType]);
      //const result = await pipe(item.category);

      return {
        label: 'foobar',
        score: 0.9
      };
    }
  }

  /**
   * Pulls raw data from the local JSON file data sink
   * to format into the training data structure
   */
  async #onScheduledDataPull() {
    try {
      const rawData = await this.DataSink.pull('/training/raw/feeds');
      const preProcessingPipeline = new this.#sandbox.my.UtilityService.SyncPipeline([
        (feedItem) => this.#stripHTML(feedItem.description),
        (text) => this.#summarize({ text }),
        this.#dedupe().bind(this),
        (text) => text?.toLowerCase(),
        this.#createTrainingInput
      ]);

      const trainingData = rawData.filter((i) => Boolean(i)).map(i => preProcessingPipeline.run(i)).filter((i) => Boolean(i.text));

      await this.DataSink.push({ bucketPath: '/training/label_required/feeds', data: { items: trainingData }});
      this.#events.dispatchEvent(new SystemEvent(Events.PIPELINE_FINISHED, {
        name: 'feed_categorization_preprocessing',
        bucket: '/training/label_required/feeds',
        itemsProcessed: trainingData.length,
        itemsTotal: rawData.length,
      }, 
      {        
        rel: 'ready_for_labeling',
        description: 'Indicates a processing pipeline has completed for a training data set'
      }));

      setTimeout(async () => {
        await this.DataSink.flush('/training/raw/feeds');
      }, 30000);
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
          throw new Error(`Validation failure on training item in (/training/label_required/${sinkName}) data sink. ENSURE ALL DATA in the "label_required sink" is labeled and valid per the schema. See any additional errors above.`);
        }
        this.#events.dispatchEvent(new SystemEvent(Events.DATA_SINK_LABELING_VALIDATED, {
            bucket: `/training/label_required/${sinkName}`
          },
          {
            rel: 'ready_for_upload',
            description: 'Indicates the *local* file data sink containing the validated and labeled training data can be pushed to object storage'
          }
        ))
      });
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (MlService): Exception encountered during scheduled label validation. See details -> ${ex.message}`);
    }
  }

  /**
   * Removes duplicates of summarized text from the training data
   * @returns {Function}
   */
  #dedupe() {
    const seen = new Set();
    return function(text) {
      const hashedString = this.#sandbox.core.createHash(text);
      return text && !seen.has(hashedString) ? (seen.add(hashedString), text) : null;
    };
  }

  /**
   * Takes a raw feed item and produces a structured training input for
   * a ML training job
   * @param {String} text 
   * @returns {Object}
   */
  #createTrainingInput(text=null) {
    return {
      text,
      label: null
    }
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
          .match(/[^.!?]+(?:[.!?]+[\])'"`’”]*\s*|$)/g) // sentence boundary regex
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