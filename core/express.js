// *************** IMPORT LIBRARY ***************
const express = require('express');

/**
 * Sets up and returns a new Express application instance.
 * @returns {import('express').Express} A new Express application instance.
 */
function InitializeExpressApp() {
  const app = express();
  return app;
}

// *************** EXPORT MODULE ***************
module.exports = InitializeExpressApp;
