// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const userSchema = new Schema(
  {
    // First name of User
    first_name: { type: String, required: true, trim: true },

    // Last name of User
    last_name: { type: String, required: true, trim: true },

    // Email of User
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },

    // Hashed password of User
    password_hash: { type: String },

    // Role of User
    role: { type: String, enum: ['admin', 'user'], default: 'user', required: true },

    // Status of User
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },

    // Reference to User who created this User
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // Soft-delete timestamp
    deleted_at: { type: Date },

    // Reference to User who deleted this User
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('user', userSchema);
