import { CronJob } from 'cron';
import path from 'path';
import { stripHtml } from 'string-strip-html';
import { ApplicationService } from '../../types/application.js';
import { JSONDataSink } from './json-data-sink.js';
import { SystemEvent, Events } from '../../types/system-event.js';

/**
 * 
 */
export class MLService extends ApplicationService {
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
    
    const SINK_FILE_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), 'sink.json');

    this.DataSink = new JSONDataSink({
      SINK_FILE_PATH,
      events: this.#events,
      logger: this.#logger,
    });

    const EVERY_24_HRS = '*/2 * * * *';

    CronJob.from({
      cronTime: EVERY_24_HRS,
      onTick: this.#onScheduledDataPull.bind(this),
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
      const rawData = await this.DataSink.pull('/training/raw/feeds');
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
        rel: 'ready_for_labeling',
        bucket: '/training/label_required/feeds'
      }));
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (MlService): Exception encountered during scheduled data pull. See details -> ${ex.message}`);
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