import { CronJob } from 'cron';
import { SystemEvent, Events } from '../../types/system-event.js';
import { ApplicationService } from '../../types/application.js';

/**
 * 
 */
export class FeedService extends ApplicationService {
    #cache;
    #currentStrategy;
    #events;
    #feedProvider;
    #sandbox;
    #logger;
    // 3 Minutes
    #DEFAULT_TTL_MILLIS = 180000;
  
    /**
     * @param {Object} sandbox
     * @param {Object} sandbox.core
     * @param {Object} sandbox.my
     * @param {MemoryCache} sandbox.my.Cache
     * @param {Object} sandbox.my.Events
     * @param {Object} sandbox.my.FeedProvider
     */
    constructor(sandbox) {
      super();
      this.#cache = sandbox.my.Cache;
      this.#events = sandbox.my.Events;
      this.#feedProvider = sandbox.my.FeedProvider;
      this.#logger = sandbox.core.logger.getLoggerInstance();
      this.#sandbox = sandbox;
    }
  
    /**
     * @param {Object} strategy
     * @returns {void}
     */
    setStrategy(strategy) {
      if (!strategy) {
        this.#logger.error(
          `INTERNAL_ERROR (RSSFeedService): Cannot set strategy (${strategy}) See details -> Strategy missing or undefined`
        );
        return;
      }
      this.#currentStrategy = strategy;
    }
  
    /**
     * @returns {Object}
     */
    async getFeed() {
      if (!this.#currentStrategy) {
        this.#logger.error(
          `INTERNAL_ERROR (FeedService): Cannot get feed. See details => No feed strategy is set`
        );
        return;
      }
      return this.#currentStrategy.getFeed();
    }
  
    /**
     * @returns {void}
     */
    async refresh() {
      const entries = Object.entries(this.#feedProvider).entries();
      for (const [idx, [feedName, feedConfig]] of entries) {
        try {
          if (!feedName) {
            return;
          }
          const LAST_REFRESH_MILLIS =
            (await this.#cache.get(`feed.${feedName}.timestamp`)) || 0;
          
          const TIMESTAMP_MILLIS = new Date().getTime();
          const ELAPSED_TIME_MILLIS = TIMESTAMP_MILLIS - LAST_REFRESH_MILLIS;
          const TTL = feedConfig?.TTL || this.#DEFAULT_TTL_MILLIS;

          if (ELAPSED_TIME_MILLIS > TTL && feedConfig.refreshType === 'pull') {

            this.setStrategy(this.#feedProvider[feedName]);

            const rawFeed = await this.getFeed();

            if (!rawFeed) {
              this.#logger.info(
                `INFO (FeedService): Could not get feed (${feedName}). See details -> getFeed request returned undefined. Check feed configuration.`
              );
              return;
            }
          
            const stringifiedFeed = JSON.stringify(rawFeed);
            const stringifiedFeedKey = `feed.${feedName}.squished`;
            
            await this.#cache.set({
              key: stringifiedFeedKey,
              value: stringifiedFeed,
            });
            
            // Since the feeds may or may not expose an `ETag` header we use 
            // a UNIX timestamp to determine the freshness of a given feed
            await this.#cache.set({
              key: `feed.${feedName}.timestamp`,
              value: new Date().getTime()
            });

            this.#events.dispatchEvent(
              new SystemEvent(Events.FEED_UPDATED, {
                key: stringifiedFeedKey,
                feedName,
              })
            );
          } else {
            this.#logger.log(`INFO: Skipping refresh of ${feedName}. TTL has NOT expired`);
          }

          if (idx === Object.keys(this.#feedProvider).length - 1) {
            this.#events.dispatchEvent(
              new SystemEvent(Events.FEEDS_REFRESHED)
            );
          }
        } catch (ex) {
          this.#logger.error(
            `INTERNAL_ERROR (FeedService): Exception encountered while refreshing (${feedName}) feed. See details -> ${ex.message}`
          );
        }
      }
    };
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

    // Will *EVENTUALLY* be every 10 minutes; for now, every 2 minutes
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
  