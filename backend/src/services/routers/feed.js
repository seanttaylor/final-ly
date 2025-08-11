import express from 'express';

/**
 * Router exposing endpoints for fetching user feeds
 */
export class FeedRouter {

  /**
   * @param {Object} options
   * @param {Object} options.cache
   * @param {Object} options.config
   * @param {Object} options.events
   */
  constructor(options) {
    const router = express.Router();

    /**
     * Returns a unique user feed
     */
    router.get('/feeds/:id', (req, res) => {
      res.set('Access-Control-Expose-Headers', 'ETag');
      // Here we will need to instrument a UserService for getting user's combined feed
      // containing all subscribed feeds
      // const userFeed = Result.ok(await options.UserService.getFeed(req.params.id));
      /* if (!userFeed.isOk()) {
        // return appropriate HTTP status codes for UserService.getFeed errors
      }*/
      
      const feed = JSON.parse(options.cache.get('feed.vanityfair.canonical'));

      res.json({
        count: feed.items.length,
        items: feed.items,
        error: null
      });
    });

    return router;
  }
}