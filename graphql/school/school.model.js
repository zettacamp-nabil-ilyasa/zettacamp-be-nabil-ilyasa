// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const school = new mongoose.Schema({
    //school's name
    brand_name: {type : String, required: true},
    //school's long name
    long_name: {type : String, required: true},
    //school's address
    address: {type : String, default: null},
    //school's students
    students: ['student'],
    //school's status
    status: {type : String, default: 'active'},
    //school's deletion date for soft delete
    deleted_at: { type: Date, default: null }
})

// *************** EXPORT MODULE *************** 
module.exports = mongoose.model('school', school)