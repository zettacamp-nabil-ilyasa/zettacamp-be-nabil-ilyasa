// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const school = new mongoose.Schema({
    //school's name
    name: {type : String, required: true},
    //school's address
    address: {type : String, default: null},
    //school's students
    students: [{type : mongoose.Schema.Types.ObjectId, ref: 'student'}],
    //school's deletion date for soft delete
    deleted_at: { type: Date, default: null }
})

// *************** EXPORT MODULE *************** 
module.exports = mongoose.model('school', school)