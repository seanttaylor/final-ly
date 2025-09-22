/**
 * @typedef {object} IEventHeader
 * @property {object} meta - metadata associated with the event
 * @property {object} meta._open - unstructured data that can arbitrarily be packaged with event;
 * this field should be considered **VOLATILE** and may or **MAY NOT** be present on any or all events
 * @property {string} id - unique identifier for the event
 * @property {string} name - name of the event
 * @property {string} timestamp - timestamp when the event was generated
 */

/**
 * @template T
 * @typedef {object} IEvent
 * @property {IEventHeader} header - header information of the event
 * @property {T} payload - payload of the event
 */

/**
 * @type {IEvent}
 */
export const IEvent = Object.freeze({});

/**
 * @typedef {object} Core
 * @property {function(): string} generateUUID - A method to generate a UUID string
 */


/**
 * @typedef {Object} Category
 * @property {string} label - Category label (e.g. "politics", "unknown")
 * @property {number} score - Confidence score for the label
 */


/**
 * @typedef {Object} Thumbnail
 * @property {string|null} url - URL of the thumbnail image, may be null
 */


/**
 * @typedef {Object} FeedItem
 * @property {string} title - The headline of the article
 * @property {string} link - Full URL to the article
 * @property {string} description - Short description or summary
 * @property {Category[]} category - Array of categories with scores
 * @property {Thumbnail} thumbnail - Thumbnail metadata
 * @property {string} source - Source publication name
 * @property {string} publicationDate - RFC-2822 formatted publication date
 * @property {string} author - Author(s) of the article
 */
export const FeedItem = Object.freeze({});

/**
 * @typedef {object} IFeed
 * @property {string} feed - Feed identifier (e.g. "nytimes_world")
 * @property {FeedItem[]} items - Array of feed items
 */

/**
 * @type {IFeed}
 */
export const IFeed = Object.freeze({});

/**
 * @typedef {Object} IServices
 * @property {EventTarget} Events
 * @property {Object} HTTPService
 * @property {Object} MLService
 * @property {Object} Cache
 * @property {Object} Config
 * @property {Object} Database
 * @property {Object} FeedMonitor
 * @property {Object} NOOPService
 * @property {Object} PatchProvider
 */

/**
 * @typedef {object} ISandbox
 * @property {IServices} my - A namespace for custom user-defined functionalities
 * @property {Core} core - The core functionalities of the sandbox environment
 * @property {function(EventType, EventListener): void} addEventListener - Method to add an event listener, bound to the context of the original object
 * @property {function(EventType, EventListener): void} removeEventListener - Method to remove an event listener, bound to the context of the original object
 * @property {function(Event): boolean} dispatchEvent - Method to dispatch an event, bound to the context of the original object
 */


/**
 * @type {ISandbox}
 * @description A sandbox environment object which encapsulates the core functionalities along with event handling methods
 */
export const ISandbox = Object.freeze({
  my: {},
  core: {},
});



/**
 * @typedef {object} DataAccessLayer
 * @property {function(): object} getDbClient - fetches a client for data access
 */

/**
 * @type {DataAccessLayer}
 * @description - API for all data access regardless of implementation
 */
export const IDataAccessLayer = Object.freeze({});