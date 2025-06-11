// *************** IMPORT LIBRARY *************** 
const mongoose = require('mongoose')

const user = new mongoose.Schema({
    //user's first name
    first_name: {type : String, required : true, trim: true},
    //user's last name
    last_name: {type : String, required : true, trim: true},
    //user's email
    email: {type : String, required : true, trim: true,},
    //user's password 
    password: {type : String, required : true, minlength: 8},
    //user's role
    role: {type : String, required : true},
    //user's status
    status: {type : String, enum: ['active', 'deleted', 'suspended']},
    //user's deletion date for soft delete
    deleted_at: { type: Date, default: null },
    deleted_by: {type : mongoose.Schema.Types.ObjectId, trim: true, ref: 'user'}
  }, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

// *************** EXPORT MODULE ***************   
module.exports = mongoose.model('user', user)