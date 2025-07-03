// *************** IMPORT LIBRARY ***************
const Express = require('express');

/**
 * Sets up and returns a new Express application instance.
 * @returns {import('express').Express} A new Express application instance.
 */
function InitializeExpressApp() {
  const app = Express();
  return app;
}

// *************** EXPORT MODULE ***************
module.exports = InitializeExpressApp;
