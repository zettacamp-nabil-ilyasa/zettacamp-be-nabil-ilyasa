// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schoolSchema = new Schema(
  {
    // Brand or trade name of School
    brand_name: { type: String, required: true, trim: true },

    // Full legal name of School
    long_name: { type: String, required: true, trim: true },

    // Address of School
    address: { type: String, trim: true },

    // Country of School
    country: { type: String, trim: true },

    // City of School
    city: { type: String, trim: true },

    // Zipcode of School
    zipcode: { type: String, trim: true },

    // Students associated with this school
    students: [{ type: Schema.Types.ObjectId, ref: 'student' }],

    // Status of School
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },

    // Soft-delete timestamp
    deleted_at: { type: Date },

    // User who created this school
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // User who deleted this school
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('school', schoolSchema);
