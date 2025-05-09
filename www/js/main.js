/**
 * 
 */
(async function() {
  const CONFIG = {
    app: {
      name: 'Current.ly',
      version: '0.0.1'
    }
  };

  try {
    console.log(`${CONFIG.app.name} v${CONFIG.app.version}`);

  } catch(ex) {
    console.error(`INTERNAL_ERROR (App): Exception encountered during startup. See details -> ${ex.message}`);
  }
}());
