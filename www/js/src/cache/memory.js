import memoryCache from 'https://esm.sh/memory-cache@latest';
import { SimpleCache } from './index.js';

const DEFAULT_TTL_MILLIS = 86400000;

export class MemoryCache extends SimpleCache {
    constructor() {
        super();
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
}