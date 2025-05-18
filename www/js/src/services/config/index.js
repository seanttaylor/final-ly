import { ApplicationService } from '../../types/application.js';
import { Feeds } from './feeds.js';

/**
 *
 */
export class Configuration extends ApplicationService {
    #sandbox;
  
    constructor(sandbox) {
        super();
        this.#sandbox = sandbox;
    }

    /**
     * @returns {Object}
     */
    get keys() {
        return {}
    }

    /**
     * @returns {Object}
     */
    get vars() {
        return {
            // Just Cors is a proxy which adds CORS headers to the proxied request. See https://justcors.com/ 
            JUST_CORS: 'https://justcors.com/tl_fd8cd2e/'
        };
    }

    /**
     * @returns {Object}
     */
    get feeds() {
        return Feeds;
    }
  }