import { ApplicationService } from '../../types/application.js';
import { SystemEvent, Events } from '../../types/system-event.js';

import { UIFeed } from './ui-feed.js';

/**
 * Houses references to all UI components for rendering in UI
 * and receiving data via events or direct method calls
 */
export class UIComponentProvider extends ApplicationService {
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();

    customElements.define('currently-feed', UIFeed);
  }

  Feed = document.querySelector('currently-feed');

}