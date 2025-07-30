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
        return {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
        }
    }

    /**
     * @returns {Object}
     */
    get vars() {
        return {
            // Just Cors is a proxy which adds CORS headers to the proxied request. See https://justcors.com/ 
            JUST_CORS: 'https://justcors.com/tl_4b13949/',
            PORT: 8080,
            OBJECT_DATA_SINK_FILE_PATH: '/training/categorization/feeds',
        };
    }

    /**
     * @returns {Object}
     */
    get feeds() {
        return Feeds;
    }
  }