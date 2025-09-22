import { ISandbox } from '../../interfaces.js';
import { ApplicationService } from '../../types/application.js';
import { SystemEvent, Events } from '../../types/system-event.js';
import { Result } from '../../types/result.js';

/**
 * Manages user subscriptions
 */
export class SubscriptionService extends ApplicationService {
  #sandbox;
  #dbClient;
  #logger;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
    this.#dbClient = sandbox.my.Database.getClient();
  }

  /**
   * @param {Object} options
   * @param {String} options.subscriber_id - uuid of the subscriber
   * @param {String} options.feed_id - uuid of the publication receiving the subscription
   * @returns {Result<Object>}
   */
  async createSubscription({ feed_id, subscriber_id }) {

    try {
      const { data: [newSub], error: newSubError } = await this.#dbClient.from('subscriptions')
      .insert({ feed_id, subscriber_id })
      .select();

      const { data: [feed], error: feedError } = await this.#dbClient.from('feeds')
      .select(
        `
        publicName,
        description
        `
      )
      .eq('id', feed_id);

      if (newSubError || feedError) {
        const error = newSubError?.message || feedError.message;
        this.#logger.error(`INTERNAL_ERROR (SubscriptionService): There was an error during subscription creation. See details -> ${error}`);
        return Result.error(error);
      }

      return Result.ok({
        feed,
        ...newSub
      });
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (SubscriptionService): **EXCEPTION ENCOUNTERED** during subscription creation. See details -> ${ex}`);
      return Result.error(ex);
    }
  } 

  /**
   * Fetches all subscriptions for a specified subscriber
   * @param {String} options.subscriber_id - uuid of the subscriber
   * @returns {Result<Object[]>}
   */
  async getSubscriptions(subscriber_id) {
    try {
      const { data: subscriptions, error } = await this.#dbClient.from('subscriptions')
      .select(
        `   
        feeds(name, publicName)
        `
      )
      .eq('subscriber_id', subscriber_id);

      if (error) {
        this.#logger.log(`INTERNAL_ERROR (SubscriptionService): There was an error fetching user subscriptions.`);
        return Result.error(error.message);
      }

      return Result.ok(subscriptions.map(i => i.feeds));
    } catch(ex) {
      this.#logger.error(`INTERNAL_ERROR (SubscriptionService): **EXCEPTION ENCOUNTERED** while fetching user subscriptions. See details -> ${ex.message}`);
      return Result.error(ex.message);
    }
  }

}