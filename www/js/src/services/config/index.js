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
            BACKEND_URL: 'https://8080-idx-final-ly-1746393087160.cluster-joak5ukfbnbyqspg4tewa33d24.cloudworkstations.dev',
            // Just Cors is a proxy which adds CORS headers to the proxied request. See https://justcors.com/ 
            JUST_CORS: 'https://justcors.com/tl_3417689/',
            
        };
    }

    /**
     * @returns {Object}
     */
    get feeds() {
        return Feeds;
    }
  }