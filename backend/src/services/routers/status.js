import express from 'express';

/**
 * Router exposing endpoints for querying application status
 */
export class StatusRouter {

  /**
   * @param {Object} middlewareProvider
   */
  constructor(middlewareProvider) {
    const router = express.Router();

    /**
     * Returns the application status
     */
    router.get('/', (req, res) => {
      res.status(204).send();
    });

    /**
     * Returns the application status
     */
    router.get('/status', (req, res) => {
      
      res.json({
        count: 1,
        items: [{
          commitHash: process.env.COMMIT_HASH || null,
          timestamp: new Date().toISOString(),
        }],
        error: null
      });
    });

    return router;
  }
}