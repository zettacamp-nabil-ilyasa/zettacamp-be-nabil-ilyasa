// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connects to MongoDB using the URI specified in the `.env` file under `MONGODB_URI`.
 * @async
 * @function ConnectDb
 * @returns {Promise<void>} - Resolves when connection is successful.
 * @throws {Error} - Throws error if the environment variable is missing or connection fails.
 */

async function ConnectDb() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not found in .env file');
    }
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// *************** EXPORT MODULE ***************
module.exports = ConnectDb;
