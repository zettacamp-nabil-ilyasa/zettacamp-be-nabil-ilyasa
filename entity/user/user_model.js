// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const user = new mongoose.Schema({
    first_name: {type : String, required : true},
    last_name: {type : String, required : true},
    email: {type : String, required : true, unique : true},
    password: {type : String, required : true},
    role: {type : String, required : true},
    deleted_at: { type: Date, default: null }
  });

// *************** EXPORT MODULE ***************   
module.exports = mongoose.model('user', user)