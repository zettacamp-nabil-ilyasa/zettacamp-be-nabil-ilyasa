// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const student = new mongoose.Schema({
    //student's first name
    first_name: {type : String, required : true},
    //student's last name
    last_name: {type : String, required : true},
    //student's email
    email: {type : String, required : true, unique : true},
    //student's date of birth
    date_of_birth: {type : Date, default: null},
    //student's school
    school_id: {type : String, required : true},
    //student's deletion date for soft delete
    deleted_at: { type: Date, default: null }
})

// *************** EXPORT MODULE *************** 
module.exports = mongoose.model('student', student)