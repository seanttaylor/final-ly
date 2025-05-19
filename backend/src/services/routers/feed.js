import express from 'express';

/**
 * Router exposing endpoints for fetching user feeds
 */
export class FeedRouter {

  /**
   * @param {Object} options
   */
  constructor(options) {
    const router = express.Router();

    /**
     * Returns a unique user feed
     */
    router.get('/feeds/:id', (req, res) => {
      
      res.json({
        count: 1, // the count of items in the feed
        items: [{ }],
        error: null
      });
    });

    return router;
  }
}