import { ApplicationService } from '../types/application.js';
import { SystemEvent, Events } from '../types/system-event.js';

/**
 * Creates a process for running data through multiple
 * synchronous steps in a specified sequence
 */
class SyncPipeline {
    #pipelineFunctions;
  
    /**
     * Initializes the pipeline
     * @param {Array} pipelineFunctions - list of functions that return values directly (synchronously)
     */
    constructor(pipelineFunctions) {
      this.#pipelineFunctions = pipelineFunctions;
    }
  
    /**
     * Launches the processing pipeline
     * @param {Object} initialValue - the value to start processing
     * @returns {Object}
     */
    run(initialValue) {
      return this.#pipelineFunctions.reduce(
        (accumulatedValue, currentFn) => currentFn(accumulatedValue),
        initialValue
      );
    }
  }

/**
 * 
 */
export class UtilityService extends ApplicationService {
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();

    this.SyncPipeline = SyncPipeline;
  }
  
}