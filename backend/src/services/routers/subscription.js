import express from 'express';

/**
 * Router exposing endpoints for managing user subscriptions
 */
export class SubscriptionRouter {

  /**
   * @param {Object} options
   * @param {Object} options.cache
   * @param {Object} options.config
   * @param {Object} options.SubscriptionService
   */
  constructor(options) {
    const router = express.Router();

    /**
     * Creates a subscription to a specified feed
     */
    router.put('/subscriptions/:feed_id', async (req, res, next) => {
      res.set('Access-Control-Expose-Headers', 'ETag');
      res.set('X-Total-Count', 1);

      try {
        const subscription = await options.SubscriptionService.createSubscription({
          feed_id: req.params.feed_id,
          subscriber_id: req.body.subscriber_id
        });
      
        if (!subscription.isOk()) {
          next(subscription.error);
          return;
        }  

        res.json({
          items: [subscription.value],
          error: null
        });
      } catch(ex) {
        next(ex);
      }
    });

    return router;
  }
}