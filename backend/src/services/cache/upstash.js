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
            timestamp: new Date().toISOString()
        }
    }

    async set({ key, value, ttl = DEFAULT_TTL_MILLIS }) {
        memoryCache.put(key, value, ttl);
    }

    get(key) {
        return memoryCache.get(key);
    }

    deleteEntry(key) {
        memoryCache.del(key);
    }

    clear() {
        memoryCache.clear();
    }

    has(key) {
        return memoryCache.keys().includes(key);
    }

    keys() {
        return memoryCache.keys();
    }
}