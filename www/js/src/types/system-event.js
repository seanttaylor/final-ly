/******** EVENT IDENTIFIERS ********/

/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
  APP_INITIALIZED: 'evt.system.app_initialized',
  // Indicates all subscribed feeds have been refreshed
  FEEDS_REFRESHED: 'evt.feeds.feeds_refreshed',
  // Indicates a single feed has been updated and cached
  FEED_UPDATED: 'evt.feeds.feed_updated',
  FEED_MONITOR_INITIALIZED: 'evt.feeds.feed_monitor_initialized',
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
    id: window.crypto.randomUUID(),
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