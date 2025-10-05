import express from 'express';
import { SystemEvent } from '../../types/system-event.js';

const router = express.Router();

// We disable `no-unused vars` here because 
// it's still an open question whether 
// environment-specific behavior will be 
// required here

/* eslint-disable no-unused-vars */

/**
 * Ensures a specified route *cannot* be access in production
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 */
function ensureNonProdEnvironmentsOnly(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    res.status(404);
    res.json([]);
    return;
  }

  next();
}

/* eslint-enable no-unused-vars */

/**
 * Router exposing endpoints to allow for querying system events
 */
export class EventsRouter {
  /**
   * @param {Object} config - dependent services and configuration options
   * @param {Object} config.MiddlewareProvider 
   * @param {Object} config.events - an instance of the events interface
   * @param {Object} config.logger - an instance of the logger interface
   */ 
  constructor(config) {
    const { MiddlewareProvider, events, logger } = config;
    router.use(MiddlewareProvider.Auth.verify);

    /**
     * Dispatches a specified application event
     */
    router.post('/events', async (req, res, next) => {
      const { name: eventName, payload, meta } = req.body;

      try {
        const event = new SystemEvent(eventName, payload, meta);
        
        events.dispatchEvent(event);
        res.set('Content-Range', `event 0-1/1`);
        res.set('X-Total-Count', 1);
        res.status(201);

        res.json([
          event.detail
        ]);      
      } catch (ex) {
        logger.error(`INTERNAL_ERROR (EventsRouter): **EXCEPTION ENCOUNTERED** while dispatching event. See details -> ${ex.message}`);
        next(ex);
      }
    });

    return router;
  }
}