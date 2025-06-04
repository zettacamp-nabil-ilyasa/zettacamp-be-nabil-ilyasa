// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const school = new mongoose.Schema({
    name: {type : String, required: true},
    address: {type : String, default: null},
    students: [{type : mongoose.Schema.Types.ObjectId, ref: 'student'}],
    deleted_at: { type: Date, default: null }
})

// *************** EXPORT MODULE *************** 
module.exports = mongoose.model('school', school)