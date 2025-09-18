import { FeedResource } from '../../types/resource.js';
import { Result } from '../../types/result.js';

export class MiddlewareProvider {
    #sandbox;
    #cache;

    /**
     * @param {Object} sandbox
     */
    constructor(sandbox) {
        this.#sandbox = sandbox;
        this.#cache = sandbox.my.Cache;
    }

    FeedService = {
        /**
         * Express middleware that queries Redis on [GET] requests for cached feeds
         * @param {*} req 
         * @param {*} res 
         * @param {*} next 
         */
        tryCache: async (req, res, next) => {
            const requestETag = req.headers['if-match'];
            const IS_CACHED_RESOURCE = await this.#cache.has(requestETag);
            const feedResource = new FeedResource();
            
            if (IS_CACHED_RESOURCE) {
                const cachedRecord = await this.#cache.get(requestETag);
                feedResource.set(Result.ok(cachedRecord));
                
                const CONTENT_RANGE = `${feedResource.name} 0-${feedResource.count}/${feedResource.count}`;
                
                res.set('Access-Control-Expose-Headers', 'ETag');
                res.set('ETag', requestETag);
                res.set('Content-Range', CONTENT_RANGE);
                res.set('X-Total-Count', feedResource.count);

                res.status(304);
                res.end();
                return;
            }

            next();
        }  
    }
}