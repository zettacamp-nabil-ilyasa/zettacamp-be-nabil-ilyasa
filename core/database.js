// *************** IMPORT CORE ***************
const Config = require('./config');

// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI specified in the `.env` file under `MONGODB_URI`.
 * @async
 * @function ConnectDb
 * @returns {Promise<void>} - Resolves when connection is successful.
 * @throws {Error} - Throws error if the environment variable is missing or connection fails.
 */
async function ConnectDb() {
  try {
    const mongoDbUri = `mongodb://${Config.DB_HOST}/${Config.DB_NAME}`;
    await Mongoose.connect(mongoDbUri);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// *************** EXPORT MODULE ***************
module.exports = ConnectDb;
