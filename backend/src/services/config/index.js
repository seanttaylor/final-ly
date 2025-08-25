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
            SUPABASE_KEY: process.env.SUPABASE_KEY,
            HF_ACCESS_TOKEN: process.env.HF_ACCESS_TOKEN,
            HF_INFERENCE_ENDPOINT: process.env.HF_INFERENCE_ENDPOINT
        }
    }

    /**
     * @returns {Object}
     */
    get vars() {
        return {
            // Just Cors is a proxy which adds CORS headers to the proxied request. See https://justcors.com/ 
            JUST_CORS: 'https://justcors.com/tl_64a0413/',
            PORT: 8080,
            OBJECT_DATA_SINK_BUCKET_NAME: '/training',
            OBJECT_DATA_SINK_FEEDS_PATH: '/categorization/feeds',
        };
    }

    /**
     * @returns {Object}
     */
    get feeds() {
        return Feeds;
    }
  }