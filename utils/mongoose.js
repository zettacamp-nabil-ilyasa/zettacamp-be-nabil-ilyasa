// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose');
require ('dotenv').config();


ConnectDb().catch(err => console.error('MongoDB connection error:', err));

/**
 * Connects to MongoDB using the MONGODB_URI defined in the environment variables.
 * @throws {Error} Throws an error if MONGODB_URI is missing or if connection fails
 * @returns {Promise<void>}
 */
async function ConnectDb() {
  try{
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not found in .env file");
    }
    await mongoose.connect(mongoUri);
  }catch(error){
    console.log(error.message)
    throw error
  }

}

// *************** EXPORT MODULE *************** 
module.exports = ConnectDb;