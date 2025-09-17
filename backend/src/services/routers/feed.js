import express from 'express';
import { FeedResource } from '../../types/resource.js';
import { Result } from '../../types/result.js';

/**
 * Router exposing endpoints for fetching user feeds
 */
export class FeedRouter {
  #cache;
  #logger;

  /**
   * @param {Object} options
   * @param {Object} options.cache
   * @param {Object} options.config
   * @param {Object} options.events
   * @param {Object} option.logger
   */
  constructor(options) {
    const router = express.Router();
    this.#cache = options.cache;
    this.#logger = options.logger;

    /**
     * Returns a unique user feed
     */
    router.get('/feeds/:id', async (req, res, next) => {
      const pageSize = Number(req.query.limit);
      const offset = Number(req.query.offset);
      const url = new URL(`${req.protocol}://${req.get('host')}${req.path}`);
      const feedResource = new FeedResource({ 
        pageSize, 
        paginated: Boolean(pageSize && offset)
      });
      const requestETag = req.headers['if-match'];
      const IS_CACHED_RESOURCE = await this.#cache.has(requestETag);
      const IS_PAGINATED = feedResource.isPaginated;
      let response;

      try {
        res.set('Access-Control-Expose-Headers', 'ETag');
        
        // ** IS THIS A CACHED RESOURCE? **
        if (IS_CACHED_RESOURCE) {
          const cachedRecord = await this.#cache.get(requestETag);
          feedResource.set(Result.ok(cachedRecord));
          res.set('ETag', requestETag);
          res.status(304);
        } else {
          const userFeed = await options.UserService.getFeed(req.params.id);
        
          if (!userFeed.isOk()) {
            // wrapped in Error to ensure the correct object structure is returned to
            // the top-level router handler
            next(new Error(userFeed.error));
            return;
          }
          
          feedResource.set(userFeed);
        }

        const CONTENT_RANGE_PAGINATED = `${feedResource.name} ${offset}-${offset + pageSize - 1}/${feedResource.count}`;
        const CONTENT_RANGE_DEFAULT = `${feedResource.name} 0-${feedResource.count}/${feedResource.count}`;
        
        // ** IS CLIENT REQUESTING A PAGINATED RESPONSE? **
        if (IS_PAGINATED) {

          response = feedResource.next(offset);
          url.searchParams.set('offset', offset + pageSize);
          url.searchParams.set('limit', pageSize);

          const link = `<${url.toString()}>; rel="next"`;
          res.set('Link', link);
          res.set('Content-Range', CONTENT_RANGE_PAGINATED);
        } else {
          res.set('Content-Range', CONTENT_RANGE_DEFAULT);
          response = feedResource.toJSON();
        }
        
        res.set('X-Total-Count', feedResource.count);
        res.json(response);

        // ETag value is **only** available AFTER the response has been sent to the client
        if (!IS_CACHED_RESOURCE) {
          const resourceETag = res.get('etag');
          await this.#cache.set({ 
            key: resourceETag, 
            value: { 
              items: feedResource.toJSON() 
            }
          });
        }
       
      } catch(ex) {
        this.#logger.error(`INTERNAL_ERROR (FeedRouter): Exception encountered while fetching user feed. See details -> ${ex.message} `);
        next(ex);
      }
    });

    return router;
  }
}