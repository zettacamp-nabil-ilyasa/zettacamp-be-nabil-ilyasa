// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const user = new mongoose.Schema(
  {
    //First name
    first_name: { type: String, required: true, trim: true },

    //Last name
    last_name: { type: String, required: true, trim: true },

    //Email
    email: { type: String, required: true, lowercase: true, trim: true },

    //Password
    password: { type: String, required: true, minlength: 8 },

    //User role
    roles: { type: [String], enum: ['admin', 'user', 'student'], default: ['user'], required: true },

    //Account status
    status: { type: String, enum: ['active', 'deleted', 'suspended'], default: 'active' },

    //Reference to user who created this user
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

    //Soft-delete timestamp
    deleted_at: { type: Date, default: null },

    //Reference to user who deleted this user
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('user', user);
