import { ISandbox } from '../../interfaces.js';
import { FeedResource } from '../../types/resource.js';
import { Result } from '../../types/result.js';

export class MiddlewareProvider {
  #sandbox;
  #cache;
  #dbClient;
  #logger;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    this.#sandbox = sandbox;
    this.#cache = sandbox.my.Cache;
    this.#dbClient = sandbox.my.Database.getClient();
    this.#logger = sandbox.core.logger.getLoggerInstance();
  }

  Auth = {
   /**
    * Middleware validating an API key accompanying a client request
    * @param {Object} dbClient - an instance of the database client
    * @param {Object} logger - an instance of the logger client
    * @returns {function(res, req, next): void} - an ExpresJS middleware function
    */
    verify: async (req, res, next) => {
      try {
        const apiKey = req.headers['x-authorization'];

        if (!apiKey) {
          res.status(401);
          res.json([]);
          return;
        }

        const CURRENT_DATETIME_MILLIS = new Date().getTime();
        const { data, error } = await this.#dbClient.from('api_keys')
          .select()
          .eq('key', apiKey);

        const [record] = data;

        if (!record) {
          throw new Error('Missing or invalid authorization credential');
        }
        const CREDENTIAL_EXPIRY_DATETIME_MILLS = new Date(record.expiryDate).getTime();

        if (CURRENT_DATETIME_MILLIS > CREDENTIAL_EXPIRY_DATETIME_MILLS) {
          res.status(401);
          res.json([]);
          return;
        }

        if (error || (!Object.keys(record).includes('key'))) {
          throw new Error(error.message);
        }

        next();
      } catch (ex) {
        this.#logger.error(`INTERNAL_ERROR (MiddlewareProvider): **EXCEPTION ENCOUNTERED while authenticating request on (${req.path}). See details -> ${ex.message}`);
        next(ex);
      }
    }
  }

  FeedService = {
    /**
     * Express middleware that queries Redis on [GET] requests for cached feeds
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    tryCache: async (req, res, next) => {
      const requestETag = req.headers['if-match'];
      const IS_CACHED_RESOURCE = await this.#cache.has(requestETag);
      const feedResource = new FeedResource();
      
      if (IS_CACHED_RESOURCE) {
        // We pull the record from the cache basically to attach the metadata since 
        // the client already has the most up-to-date version of the resource
        const cachedRecord = await this.#cache.get(requestETag);
        feedResource.set(Result.ok(cachedRecord));
        
        const CONTENT_RANGE = `${feedResource.name} 0-${feedResource.count}/${feedResource.count}`;
          
        res.set('Access-Control-Expose-Headers', 'ETag');
        res.set('ETag', requestETag);
        res.set('Content-Range', CONTENT_RANGE);
        res.set('X-Total-Count', feedResource.count);

        res.status(304);
        res.end();
        return;
      }

      next();
    }  
  }
}