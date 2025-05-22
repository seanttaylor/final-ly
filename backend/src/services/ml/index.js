import path from 'path';
import { ApplicationService } from '../../types/application.js';
import { JSONDataSink } from './json-data-sink.js';

/**
 * 
 */
export class MLService extends ApplicationService {
  #events;
  #logger;
  #sandbox;


  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    this.#events = sandbox.my.Events;
    this.#logger = sandbox.core.logger.getLoggerInstance();   
    
    const SINK_FILE_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), 'sink.json');

    this.DataSink = new JSONDataSink({
      SINK_FILE_PATH,
      events: this.#events,
      logger: this.#logger,
    })
  }
  
}