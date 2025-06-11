// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const student = new mongoose.Schema({
    //student's first name
    first_name: {type : String, trim: true, required : true},
    //student's last name
    last_name: {type : String, trim: true, required : true},
    //student's email
    email: {type : String, trim: true, required : true, unique : true, match: /.+\@.+\..+/},
    //student's date of birth
    date_of_birth: {type : Date, default: null},
    //student's school
    school_id: {type : mongoose.Schema.Types.ObjectId, required : true, trim: true, ref: 'school'},
    //student's status
    user_id: {type : mongoose.Schema.Types.ObjectId, trim: true, ref: 'user'},
    status: {type : String, enum: ['active', 'deleted', 'suspended'],default: 'active'},
    //student's deletion date for soft delete
    deleted_at: { type: Date, default: null },
    deleted_by: {type : mongoose.Schema.Types.ObjectId, ref: 'user'}
},{
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
})

// *************** EXPORT MODULE *************** 
module.exports = mongoose.model('student', student)