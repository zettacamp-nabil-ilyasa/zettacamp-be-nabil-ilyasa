// *************** IMPORT LIBRARY ***************
const dotenv = require('dotenv');

// *************** load environment variables
dotenv.config();

// *************** check if environment variables are set
if (!process.env.DB_NAME || !process.env.DB_HOST || !process.env.PORT) {
  console.error('missing environtment variables: DB_NAME, DB_HOST, or PORT ');
  process.exit(1);
}

// *************** set up config object
const config = {
  PORT: process.env.PORT,
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
};

// *************** EXPORT MODULE ***************
module.exports = config;
