// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const school = new mongoose.Schema(
  {
    //school's name
    brand_name: { type: String, required: true, trim: true },

    //school's long name
    long_name: { type: String, required: true, trim: true },

    //school's address
    address: { type: String, trim: true, default: null },

    //school's status
    status: { type: String, enum: ['active', 'deleted', 'suspended'], default: 'active' },

    //school's deletion date for soft delete
    deleted_at: { type: Date, default: null },

    //user that deleted the school
    deleted_by: { type: mongoose.Schema.Types.ObjectId, trim: true, ref: 'user' },
  },
  {
    // timestamp set-up for created_at and updated_at
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('school', school);
