// import { IEvent, ISandbox, IEventProcessing } from '../../interfaces.js';
// import { SystemEvent, Events } from '../../types/system-event.js';

import { ApplicationService } from '../../types/application.js';
import { StatusRouter } from './status.js';
//import { EventsRouter } from './events.js';

/**
 * @typedef {object} DependentServices
 */

export class RouteService extends ApplicationService {
  #sandbox;
  Status;

  /**
   * @param {ISandbox & {my: DependentServices}} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    //this.#sandbox.my.MiddlewareProvider;

    //const MiddlewareProvider = this.#sandbox.my.MiddlewareProvider;
    //const dataAccessLayer = this.#sandbox.my.DataAccessLayer;
    const events = this.#sandbox.my.Events;
    const config = this.#sandbox.my.Config;

    this.Status = new StatusRouter(/*this.#sandbox.my.MiddlewareProvider*/);
    //this.Events = new EventsRouter({ MiddlewareProvider, events });
  }
}