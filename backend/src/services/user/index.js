import { ApplicationService } from '../../types/application.js';
import { SystemEvent, Events } from '../../types/system-event.js';
import { Result } from '../../types/result.js';


/**
 * Manages platform users
 */
export class UserService extends ApplicationService {
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
  }


  /**
   * @param {Object[]} feeds - list of feeds to fetch from the cache
   * @returns {Object[]}
   */
  #buildUserFeed(feeds) {

  }

  /**
   * @param {Object[]} feeds - ranks and sorts feed items based on user preferences
   * @returns {Object[]}
   */
  #sortUserFeed(feeds) {

  }


  /**
   * Returns a sorted, combined list of all a specified users subscribed feeds
   * @param {String} user_id - uuid of a user
   * @returns {Result<Object[]>}
   */
  async getFeed(user_id) {
    // Get user subscriptions [X]
    // Iterate over subscriptions [] 
    // Pull from the cache for each one []
    // Sort as necessary? []

    try { 
      const userSubscriptions = await this.#sandbox.my.SubscriptionService.getSubscriptions(user_id);
      //const finalizedUserFeed = userSubscriptions.map(this.#buildUserFeed)
      //.map(this.#sortUserFeed);

      // return finalizedUserFeed;
      return Result.ok([]);
    } catch(ex) {
      this.#logger.log(`INTERNAL_ERROR (UserService): **EXCEPTION ENCOUNTERED** while fetching user feed. See details -> ${ex.message}`);
      return Result.error(ex.message);
    }
  }

}