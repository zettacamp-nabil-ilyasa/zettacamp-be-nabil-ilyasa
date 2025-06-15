// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const student = new mongoose.Schema(
  {
    //First name
    first_name: { type: String, trim: true, required: true },

    //Last name
    last_name: { type: String, trim: true, required: true },

    //Email
    email: { type: String, trim: true, required: true },

    //Date of birth
    date_of_birth: { type: Date, default: null },

    //reference to school
    school_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'school' },

    //reference to associated user
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

    //Student status
    status: { type: String, enum: ['active', 'deleted', 'suspended'], default: 'active' },

    //Soft-delete timestamp
    deleted_at: { type: Date, default: null },

    //reference to user who deleted this student
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
module.exports = mongoose.model('student', student);
