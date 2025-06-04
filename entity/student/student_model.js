// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const student = new mongoose.Schema({
    first_name: {type : String, required : true},
    last_name: {type : String, required : true},
    email: {type : String, required : true, unique : true},
    date_of_birth: {type : Date, required : false},
    school_id: {type : String, required : true},
    deleted_at: { type: Date, default: null }
})

// *************** EXPORT MODULE *************** 
module.exports = mongoose.model('student', student)