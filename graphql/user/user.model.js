// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const user = new mongoose.Schema(
  {
    //First name
    first_name: { type: String, required: true, trim: true },

    //Last name
    last_name: { type: String, required: true, trim: true },

    //Email
    email: { type: String, required: true, trim: true },

    //Password
    password: { type: String, required: true, minlength: 8 },

    //User role
    roles: { type: [String], enum: ['admin', 'user', 'student'], default: ['user'], required: true },

    //Reference to student who is associated with this user
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'student' },

    //Account status
    status: { type: String, enum: ['active', 'deleted', 'suspended'], default: 'active' },

    //Soft-delete timestamp
    deleted_at: { type: Date, default: null },

    //Reference to user who deleted this user
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for created_at and updated_at
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('user', user);
