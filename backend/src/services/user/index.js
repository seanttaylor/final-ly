import { ApplicationService } from '../../types/application.js';
import { SystemEvent, Events } from '../../types/system-event.js';
import { Result, AsyncResult } from '../../types/result.js';

/**
 * Manages platform users
 */
export class UserService extends ApplicationService {
  #cache;
  #dbClient;
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
    this.#cache = sandbox.my.Cache;
    this.#dbClient = sandbox.my.Database.getClient();
  }

  /**
   * @param {Object[]} feedList - list of feeds to fetch from the cache
   * @returns {Object[]}
   */
  async #buildUserFeed(feedList) {
    try { 
      const allFeeds = feedList.map(async (item) => {
        const key = `feed.${item.name}.canonical`;
        const feed = await this.#cache.get(key);
        return feed;
      });
      const f = (await Promise.all(allFeeds)).filter(Boolean);

      // See issue no. 8 to refactor this block
      return f.reduce((result, curr) => {
        result.items.push(...curr.items);
        return result;
      }, { items: [] });

    } catch(ex) {
      this.#logger.log(`INTERNAL_ERROR (UserService): **EXCEPTION ENCOUNTERED** while building user feed. See details -> ${ex.message}`);
      return AsyncResult.error(ex);
    }
  }

  /**
   * Ranks and sorts feed items based on user preferences
   * @param {Object} categoryRanking - user feed item category rank
   * @param {Object[]} feedList - list of feeds fetched from the cache
   * @returns {Object[]}
   */
  async #sortUserFeed(categoryRanking, feedList) {
    try {
      feedList.items = feedList.items.sort((prevItem, nextItem) => {
        const [prevCategory] = prevItem.category;
        const [nextCategory] = nextItem.category;
  
        // We we turn on categorization post-fetch, feed items **WILL** have a label prop, then we can remove the (?)
        return (categoryRanking[prevCategory?.label] || 0) - (categoryRanking[nextCategory?.label] || 0);
      });

      return feedList;
    } catch(ex) {
      this.#logger.log(`INTERNAL_ERROR (UserService): **EXCEPTION ENCOUNTERED** while sorting user feed. See details -> ${ex.message}`);
      return AsyncResult.error(ex);
    }
  }

  /** 
  * @param {String} user_id - uuid of a user
  * @returns {Result<Object>}
  */ 
  async getUserPreferences(user_id) {
    try {
      const { data: [{preferences}], preferencesError } = await this.#dbClient.from('accounts')
      .select('preferences')
      .eq('id', user_id);

      if (preferencesError) {
        this.#logger.error(`INTERNAL_ERROR (UserService): Error occurred while fetching user preferences. See details -> ${preferencesError.message}`);
        return Result.error(preferencesError.message);
      }

      return Result.ok(preferences);
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (UserService): **EXCEPTION ENCOUNTERED** while fetching user preferences. See details -> ${ex.message}`);
      return Result.error(ex);
    }
  }


  /**
   * Returns a sorted, combined list of all a specified users subscribed feeds
   * @param {String} user_id - uuid of a user
   * @returns {Result<Object[]>}
   */
  async getFeed(user_id) {
    try { 
      const { categoryRanking } = (await this.getUserPreferences(user_id)).getValue();
      const userSubscriptions = await this.#sandbox.my.SubscriptionService.getSubscriptions(user_id);
     
      const finalizedUserFeed = await AsyncResult.ok(userSubscriptions)
      .map(this.#buildUserFeed.bind(this))
      .map(this.#sortUserFeed.bind(this, categoryRanking))
      .run();

      if (!finalizedUserFeed.isOk()) {
        this.#logger.log(`INTERNAL_ERROR (UserService): Error occurred while finalizing the user feed. See details -> ${finalizedUserFeed.error}`);
      }

      return finalizedUserFeed;
    } catch(ex) {
      this.#logger.log(`INTERNAL_ERROR (UserService): **EXCEPTION ENCOUNTERED** while fetching user feed. See details -> ${ex.message}`);
      return Result.error(ex);
    }
  }
}