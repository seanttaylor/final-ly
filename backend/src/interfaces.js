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
 * @typedef {object} ISandbox
 * @property {object} my - A namespace for custom user-defined functionalities
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