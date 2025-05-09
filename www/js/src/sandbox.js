/**
 * @summary The core of the application; registers and emits events
 */
export class Sandbox extends EventTarget {
    /**
     * @param {String[]} modules
     * @param {Function} callback
     */
    constructor(modules, callback) {
      super();
  
      const factories = {};
  
      /**
       * An object with the `core` namespaces and event-related methods available to
       * all modules; provided in the callback to the `Sandbox` constructor
       */
      const sandbox = {
        my: {},
        core: {
          fetch: fetch,
          generateUUID: this.generateUUID,
          logger: {
            getLoggerInstance: () => console,
          },
        },
        // Bind event methods from the EventTarget (i.e., this) to ensure proper context
        addEventListener: this.addEventListener.bind(this),
        dispatchEvent: this.dispatchEvent.bind(this),
      };
  
      // Create factories for each module
      modules.forEach((moduleName) => {
        if (!Sandbox.modules[moduleName]) {
          console.error(`INTERNAL_ERROR (sandbox): Cannot create factory; module not found (${moduleName})`);
          return;
        }
        factories[moduleName] = () => new Sandbox.modules[moduleName](sandbox);
      });
  
      // Lazily initialize the modules using `Object.defineProperty`
      Object.entries(factories).forEach(([moduleName, factory]) => {
        Object.defineProperty(sandbox.my, moduleName, {
          get: () => {
            if (!sandbox.my[`__${moduleName}`]) {
              try {
                sandbox.my[`__${moduleName}`] = factory(); // Create module lazily
              } catch (ex) {
                console.error(
                  `INTERNAL_ERROR (sandbox): Could not create module (${moduleName}); ensure this module is registered via Sandbox.modules.of. See details -> ${ex.message}`
                );
              }
            }
            return sandbox.my[`__${moduleName}`];
          },
        });
      });
  
      // Pass the sandbox object with `my` and `core` namespaces to the callback
      callback(sandbox);
  
      /**
       * Though Sandbox extends EventTarget we *only* return a `dispatchEvent` method to
       * ensure that event registrations occur inside the Sandbox. This prevents
       * "eavesdropping" on events by clients that are not sandboxed. All such clients
       * can do is notify the sandbox of an external event of interest
       */
      return {
        dispatchEvent: this.dispatchEvent.bind(this),
      };
    }
  
    /**
     * Generates a version 4 UUID
     * @returns {String}
     */
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    }
  
    /**
     *  Houses sandbox module definitions
     */
    static modules = {
      /**
       * @param {String} moduleName - the identifier for the module to be referenced by
       * @param {Object} moduleClass - module's constructor
       */
      of: function (moduleName, moduleClass) {
        Sandbox.modules[moduleName] = moduleClass;
      },
    };
  }