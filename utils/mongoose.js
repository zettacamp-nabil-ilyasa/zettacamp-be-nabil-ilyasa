// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose');
require ('dotenv').config();


ConnectDb().catch(err => console.error('MongoDB connection error:', err));

async function ConnectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not found in .env file");
  }
  await mongoose.connect(mongoUri);
}

// *************** EXPORT MODULE *************** 
module.exports = ConnectDb;