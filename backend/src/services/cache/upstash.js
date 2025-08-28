import { SimpleCache } from './index.js';
import { Redis } from '@upstash/redis'

const DEFAULT_TTL_MILLIS = 86400000; // 24 hours

export class Upstash extends SimpleCache {
  #logger;
  #redis;
  #sandbox;

  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();

    const { UPSTASH_URL, UPSTASH_TOKEN } = sandbox.my.Config.keys;

    this.#redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });
  }

  get status() {
    return {
      name: this.constructor.name,
      timestamp: new Date().toISOString(),
    };
  }

  async set({ key, value, ttl = DEFAULT_TTL_MILLIS }) {
    const ttlSeconds = Math.floor(ttl / 1000);
    await this.#redis.set(key, value, { ex: ttlSeconds });
  }

  async get(key) {
    return await this.#redis.get(key);
  }

  async deleteEntry(key) {
    await this.#redis.del(key);
  }

  async clear() {
    await this.#redis.flushdb();
  }

  async has(key) {
    const exists = await this.#redis.exists(key);
    return exists === 1;
  }

  async keys(pattern = '*') {
    return await this.#redis.keys(pattern);
  }
}