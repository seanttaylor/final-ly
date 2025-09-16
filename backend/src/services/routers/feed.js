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
      try {
        res.set('Access-Control-Expose-Headers', 'ETag');
        const requestETag = req.headers['etag'];
        const feedResource = new FeedResource();

        if (await this.#cache.has(requestETag)) {
          const cachedRecord = await this.#cache.get(requestETag);
          feedResource.set(Result.ok(cachedRecord));
          res.set('ETag', requestETag);
          res.set('X-Total-Count', feedResource.count);
          res.status(304);
          res.json(feedResource);
          return;
        }

        const userFeed = await options.UserService.getFeed(req.params.id);
        
        if (!userFeed.isOk()) {
          // wrapped in Error to ensure the correct object structure is returned to
          // the top-level router handler
          next(new Error(userFeed.error));
          return;
        }

        feedResource.set(userFeed);
        res.set('X-Total-Count', feedResource.count);
        res.json(feedResource);

        const resourceETag = res.get('etag');
        await this.#cache.set({ 
          key: resourceETag, 
          value: feedResource.toJSON() 
        });

      } catch(ex) {
        this.#logger.error(`INTERNAL_ERROR (FeedRouter): Exception encountered while fetching user feed. See details -> ${ex.message} `);
        next(ex);
      }
      
    });

    return router;
  }
}