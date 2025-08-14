import { ApplicationService } from '../../types/application.js';
import { SystemEvent, Events } from '../../types/system-event.js';
import { Result } from '../../types/result.js';


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
  #buildUserFeed(feedList) {
    return feedList.reduce((result, item) => {
      const key = `feed.${item.name}.canonical`;
      const feed = JSON.parse(this.#cache.get(key));
      result.push(...feed.items);
      return result;
    }, []);
  }

  /**
   * Ranks and sorts feed items based on user preferences
   * @param {Object} categoryRanking - user feed item category rank
   * @param {Object[]} feedList - list of feeds to fetch from the cache
   * @returns {Object[]}
   */
  #sortUserFeed(categoryRanking, feedList) {
    return feedList.sort((prevItem, nextItem) => {
      const [prevCategory] = prevItem.category;
      const [nextCategory] = nextItem.category;

      return categoryRanking[prevCategory] - categoryRanking[nextCategory];
    });
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
        this.#logger.log(`INTERNAL_ERROR (UserService): Error occurred while fetching user preferences. See details -> ${preferencesError.message}`);
        return Result.error(preferencesError.message);
      }

      return Result.ok(preferences);
    } catch(ex) {
      this.#logger.log(`INTERNAL_ERROR (UserService): **EXCEPTION ENCOUNTERED** while fetching user preferences. See details -> ${ex.message}`);
      return Result.error(ex);
    }
  }


  /**
   * Returns a sorted, combined list of all a specified users subscribed feeds
   * @param {String} user_id - uuid of a user
   * @returns {Result<Object[]>}
   */
  async getFeed(user_id) {
    // Get user subscriptions [X]
    // Iterate over subscriptions [X] 
    // Pull from the cache for each one [X]
    // Sort as necessary? [X]

    try { 
      const { categoryRanking } = (await this.getUserPreferences(user_id)).getValue();
      const userSubscriptions = await this.#sandbox.my.SubscriptionService.getSubscriptions(user_id);
     
      const finalizedUserFeed = userSubscriptions.map(this.#buildUserFeed.bind(this))
      //.map(this.#sortUserFeed.bind(this, categoryRanking));

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