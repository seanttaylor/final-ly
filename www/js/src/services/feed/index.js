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
    #DEFAULT_TTL_MILLIS = 180000;
  
    /**
     * @param {Object} sandbox
     * @param {Object} sandbox.core
     * @param {Object} sandbox.my
     * @param {MemoryCache} sandbox.my.cache
     * @param {Object} sandbox.my.events
     * @param {Object} sandbox.my.FeedProvider
     */
    constructor(sandbox) {
      super();
      this.#cache = sandbox.my.cache;
      this.#events = sandbox.my.events;
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
      Object.entries(this.#feedProvider).forEach(
        async ([feedName, feedConfig], idx, array) => {
          try {
            if (!feedName) {
              return;
            }
            const LAST_REFRESH_MILLIS =
              (await this.#cache.get(`feed.${feedName}.lastRefresh`)) || 0;
            const TIMESTAMP_MILLIS = new Date().getTime();
            const ELAPSED_TIME_MILLIS = TIMESTAMP_MILLIS - LAST_REFRESH_MILLIS;
            const TTL = feedConfig?.TTL || this.#DEFAULT_TTL_MILLIS;
  
            if (ELAPSED_TIME_MILLIS > TTL && feedConfig.refreshType === 'pull') {
              this.setStrategy(this.#feedProvider[feedName]);
  
              const feed = await this.getFeed();
  
              this.#logger.log(feed);
  
              if (!feed) {
                this.#logger.info(
                  `INFO (FeedService): Could not get feed (${feedName}). See details -> getFeed request returned undefined. Check feed configuration.`
                );
                return;
              }
              const stringifiedFeed = JSON.stringify(feed);
              const key = `feed.${feedName}.${this.#sandbox.core.createHash(stringifiedFeed)}`;
  
              await this.#cache.set({
                key,
                value: stringifiedFeed,
              });
  
              this.#events.dispatchEvent(
                new SystemEvent(Events.FEED_UPDATED, {
                  key,
                  feedName,
                })
              );
  
              if (idx + 1 === array.length) {
                this.#events.dispatchEvent(
                  new SystemEvent(Events.FEED_REFRESH_COMPLETE)
                );
              }
            }
          } catch (ex) {
            this.#logger.error(
              `INTERNAL_ERROR (FeedService): Exception encountered while refreshing (${feedName}) feed. See details -> ${ex.message}`
            );
          }
        }
      );
    }
  }
  