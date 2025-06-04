// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose');

ConnectDB().catch(err => console.log(err));

async function ConnectDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
}

// *************** EXPORT MODULE *************** 
module.exports = ConnectDB;