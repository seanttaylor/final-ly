import { ApplicationService } from '../../types/application.js';
import { createClient } from '@supabase/supabase-js';

/**
 *
 */
export class Database extends ApplicationService {
    #client;
    #logger;
    #sandbox;
  
    constructor(sandbox) {
        super();
        try {
            const { SUPABASE_URL, SUPABASE_KEY } = sandbox.my.Config.keys;
            this.#sandbox = sandbox;
            this.#logger = sandbox.core.logger.getLoggerInstance();
            this.#client = createClient(SUPABASE_URL, SUPABASE_KEY);
        } catch(ex) {
            this.#logger.log(`INTERNAL_ERROR (Database): Exception encountered during initialization. See details -> ${ex.message}`);
        }
    }

    /**
     * Gets an instance of the Supabase client
     * @returns {Object} 
     */
    getClient() {
        return this.#client;
    }
  }