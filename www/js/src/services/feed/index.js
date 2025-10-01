import { CronJob } from 'https://esm.sh/cron@latest';

import { SystemEvent, Events } from '../../types/system-event.js';
import { ApplicationService } from '../../types/application.js';

/**
 * 
 */
export class FeedService extends ApplicationService {
    #events;
    #sandbox;
    #logger;
    #DEFAULT_TTL_MILLIS = 180000;
  
    /**
     * @param {Object} sandbox
     * @param {Object} sandbox.core
     * @param {Object} sandbox.my
     * @param {Object} sandbox.my.Events
     * @param {Object} sandbox.my.FeedProvider
     */
    constructor(sandbox) {
      super();
      this.#events = sandbox.my.Events;
      this.#logger = sandbox.core.logger.getLoggerInstance();
      this.#sandbox = sandbox;
    }
  
    /**
     * @returns {Object}
     */
    async getFeed() {
      try {
        // See issue no. 12
        const response = await fetch(`${this.#sandbox.my.Config.vars.BACKEND_URL}/feeds/050a4d06-4f31-42e2-b0fe-07e1838179f8`);
        const body =  await response.json();

        return {
          etag: response.headers.get('ETag'),
          data: body
        }
      } catch(ex) {
        this.#logger.error(
          `INTERNAL_ERROR (FeedService): Exception encountered while fetching feed. See details => ${ex.message}`
        );
      }
    }
  
    /**
     * @returns {void}
     */
    async refresh() {
      try {
        
        const feedResult = await this.getFeed();
        //this.#logger.log(feedResult);

        // if (this.#validateFeed(feedResult))
        if (!feedResult) {
          this.#logger.info(
            `INFO (FeedService): Could not validate user feed. See details -> (VALIDATION FAILURE DETAILS)`
          );
          return;
        }
        
        const key = 'com.current.ly.feed';
        this.#events.dispatchEvent(
          new SystemEvent(Events.FEED_REFRESHED, {
            etag: feedResult.etag,
            feed: feedResult.data,
          })
        );
      } catch (ex) {
        this.#logger.error(
          `INTERNAL_ERROR (FeedService): Exception encountered while refreshing feed. See details -> ${ex.message}`
        );
      }
    }
}

/**
 *
 */
export class FeedMonitor extends ApplicationService {
  #events;
  #feedService;
  #logger;

  /**
   * @param {Object} sandbox
   * @param {Object} sandbox.my
   * @param {Object} sandbox.my.Events
   * @param {RSSFeedService} sandbox.my.FeedService
   */
  constructor(sandbox) {
    super();
    this.#events = sandbox.my.Events;
    this.#feedService = sandbox.my.FeedService;
    this.#logger = sandbox.core.logger.getLoggerInstance();

    const EVERY_10_MIN = '*/2 * * * *';
    try {
      CronJob.from({
        cronTime: EVERY_10_MIN,
        onTick: this.#onScheduledRefresh.bind(this),
        start: true,
        timeZone: 'America/Los_Angeles',
      });
      this.#events.dispatchEvent(
        new SystemEvent(Events.FEED_MONITOR_INITIALIZED)
      );
      
    } catch(ex) {
      this.#logger.error(
        `INTERNAL_ERROR (FeedMonitor): Exception encountered while initializing the feed monitor. See details -> ${ex.message}`
      );
    }
  }

  /**
   *
   */
  async #onScheduledRefresh() {
    try {
      await this.#feedService.refresh();
    } catch (ex) {
      this.#logger.error(
        `INTERNAL_ERROR (FeedMonitor): Exception encountered during scheduled feed refresh. See details -> ${ex.message}`
      );
    }
  }
}
  