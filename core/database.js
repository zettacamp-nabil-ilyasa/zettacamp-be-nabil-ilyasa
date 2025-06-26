// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const config = require('./config');

/**
 * Connects to MongoDB using the URI specified in the `.env` file under `MONGODB_URI`.
 * @async
 * @function ConnectDb
 * @returns {Promise<void>} - Resolves when connection is successful.
 * @throws {Error} - Throws error if the environment variable is missing or connection fails.
 */
async function ConnectDb() {
  try {
    const MongoDbUri = `mongodb://${config.DB_HOST}/${config.DB_NAME}`;
    await mongoose.connect(MongoDbUri);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// *************** EXPORT MODULE ***************
module.exports = ConnectDb;
