import { randomUUID } from 'node:crypto';

/******** EVENT IDENTIFIERS ********/

/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
  APP_INITIALIZED: 'evt.system.app_initialized',
  // Indicates the training data sink has been loaded successfully
  DATA_SINK_LOADED: 'evt.ml.training.data_sink_loaded',
  // Indicates all labeling data in data sinks accurate for training
  DATA_SINK_LABELING_VALIDATED: 'evt.ml.training.data_sink_labeling_validated',
  // Indicates all subscribed feeds have been refreshed
  FEEDS_REFRESHED: 'evt.feeds.feeds_refreshed',
  // Indicates a single feed has been updated and cached
  FEED_UPDATED: 'evt.feeds.feed_updated',
  FEED_MONITOR_INITIALIZED: 'evt.feeds.feed_monitor_initialized',
  // Indicates the currently-feed component has been initialized
  FEED_COMPONENT_INITIALIZED: 'evt.ui.components.feed_initialized',
  // Indicates a processing pipeline has completed for a training data set
  PIPELINE_FINISHED: 'evt.ml.pipeline_finished',
  // Indicates the validated, labeled training data has successfully uploaded to object storage
  TRAINING_DATA_UPLOADED: 'evt.ml.training.data_uploaded'
});

/**
 * 
 */
class CustomEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type);
    this.detail = eventInitDict.detail || null;
  }
}


/**
 *
 */
export class SystemEvent {
  header = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    meta: { _open: { rel: null, type: null } },
    name: null,
    
  };
  payload;

  /**
   * @param {String} name
   * @param {Object} payload
   * @param {Object} metadata
   */
  constructor(name, payload = {}, metadata = {}) {
    this.header.meta = { ...metadata };
    this.header.name = name;
    this.payload = payload;

    return new CustomEvent(name, {
      detail: this,
    });
  }
}