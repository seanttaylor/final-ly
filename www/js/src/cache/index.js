/**
 * @typedef {Object} CacheEntry
 * @property {String} key - the key of a specified cache entry
 * @property {String} value - the value of a cache entry
 * @property {Number} ttl - the Time-to-Live of the cache entry
 */

export class SimpleCache {
    DEFAULT_TTL = 300000;
  
    /**
     * Creates a new entry in the cache
     * @param {CacheEntry} cacheEntry
     */
    set({ key, value, ttl = this.DEFAULT_TTL }) {}
  
    /**
     * Returns an existing CacheEntry
     * @param {String} key
     * @returns {Any}
     */
    get(key) {}
  
    /**
     * Deletes an existing CacheEntry
     * @param {String} key
     */
    delete(key) {}
  
    /**
     * Flushes the entire cache
     */
    clear() {}
  
    /**
     * Checks for the existence of a CacheEntry
     * @param {String} key
     */
    has(key) {}
  }
  