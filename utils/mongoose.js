// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connects to MongoDB using the MONGODB_URI defined in the environment variables.
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if MONGODB_URI is missing or if connection fails
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
