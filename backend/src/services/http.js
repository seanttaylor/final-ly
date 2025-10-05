import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import cors from 'cors';
import { randomUUID } from 'crypto';

/******** INTERFACES ********/

/* eslint-disable no-unused-vars */
import { ISandbox } from '../interfaces.js';

/* eslint-enable no-unused-vars */

import { ApplicationService } from '../types/application.js';

/**
 * 
 */
export class HTTPService extends ApplicationService {
  #sandbox;
  #logger;

  /**
   * 
   * @param {ISandbox} sandbox 
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox; 
    this.#logger = sandbox.core.logger.getLoggerInstance();
  }

  start() {
    this.#logger.info('Starting HTTP service...');
    // this is where the server should be defined
    const PORT = this.#sandbox.my.Config.vars.PORT;
    const app = express();
    const simpleRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    /******** MIDDLEWARE ********/
    app.use(cors({
      allowedHeaders: [ 
        'apikey', 
        'authorization', 
        'content-type', 
        'referer',
        'user-agent', 
        'x-authorization'
      ]
    }));
    app.use(morgan('tiny'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static('static'));

    /**
     * Applies a `request_id` to all incoming API requests
     */
    app.use((req, res, next) => {
      res.locals.request_id = randomUUID();
      next();
    });
    
    app.use(this.#sandbox.my.RouteService.Status);
    app.use(this.#sandbox.my.RouteService.Feed);
    app.use(this.#sandbox.my.RouteService.Subscription);

    // Rate-limited routes
    app.use(simpleRateLimiter);
    app.use(this.#sandbox.my.RouteService.Events);

    // Authenticated routes
    // app.use(this.#sandbox.my.MiddlewareProvider.authenticate.bind( 
    //   this.#sandbox.my.MiddlewareProvider
    // ));

   
    app.use((req, res, next) => {
      res.set('X-Total-Count', 0);

      const status = 404;
      // console.error(`Error 404 on ${req.url}.`);
      res.status(status).send({ 
        status,
        items: [], 
        error: 'NOT_FOUND' 
      });
    });

    // The `next` parameter here is required *even when not in use* per the ExpressJS documentation on error handling middleware
    // See (https://expressjs.com/en/guide/using-middleware.html#middleware.error-handling)
    // eslint-disable-next-line
    app.use((err, req, res, next) => {
      const status = 500;
      const error = err.error || err.message;

      res.set('X-Total-Count', 0);
      res.set('X-Request-Id', res.locals.request_id);
      
      console.error(`INTERNAL_ERROR (HTTPService): **EXCEPTION ENCOUNTERED** on route (${req.path}). See details -> ${error}`);
      res.status(status).send([]);
    });
    
    // Skips launching backend in unit test mode
    if (process.env.NODE_ENV !== 'ci/cd/test/unit') {
      app.listen(PORT, () => {
        console.log(`Backend listening at http://localhost:${PORT}`);
      });
    }
  }
}