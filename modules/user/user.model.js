// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const user = new mongoose.Schema(
  {
    //First name
    first_name: { type: String, required: true, trim: true },

    //Last name
    last_name: { type: String, required: true, trim: true },

    //Email
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },

    //Password hashed
    password_hash: { type: String },

    //User role
    roles: { type: [String], enum: ['admin', 'user'], default: ['user'], required: true },

    //Account status
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },

    //Soft-delete timestamp
    deleted_at: { type: Date },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('user', user);
