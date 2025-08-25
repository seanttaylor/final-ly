import express from 'express';

/**
 * Router exposing endpoints for fetching user feeds
 */
export class FeedRouter {
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
    this.#logger = options.logger;

    /**
     * Returns a unique user feed
     */
    router.get('/feeds/:id', async (req, res, next) => {
      try {

        res.set('Access-Control-Expose-Headers', 'ETag');
        // Here we will need to instrument a UserService for getting user's combined feed
        // containing all subscribed feeds
        const userFeed = await options.UserService.getFeed(req.params.id);
        
        if (!userFeed.isOk()) {
          // wrapped in Error to ensure the correct object structure is returned to
          // the top-level router handler
          next(new Error(userFeed.error));
          return;
        }
      
        const feed = JSON.parse(options.cache.get('feed.vanityfair.canonical'));
        res.set('X-Total-Count', feed.items.length);

        res.json({
          items: feed.items,
          error: null
        });

      } catch(ex) {
        this.#logger.error(`INTERNAL_ERROR (FeedRouter): Exception encountered while fetching user feed. See details -> ${ex.message} `);
        next(ex);
      }
      
    });

    return router;
  }
}