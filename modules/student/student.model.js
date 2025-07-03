// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const studentSchema = new Schema(
  {
    // First name of Student
    first_name: { type: String, trim: true, required: true },

    // Last name of Student
    last_name: { type: String, trim: true, required: true },

    // Email of Student
    email: { type: String, trim: true, lowercase: true, required: true, unique: true },

    // Date of birth of Student
    date_of_birth: { type: Date },

    // Reference to school
    school_id: { type: Schema.Types.ObjectId, required: true, ref: 'school' },

    // Status of Student
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },

    // Soft-delete timestamp
    deleted_at: { type: Date },

    // Reference to User who created this student
    created_by: { type: Schema.Types.ObjectId, ref: 'user', required: true },

    // Reference to User who deleted this student
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('student', studentSchema);
