// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const school = new mongoose.Schema(
  {
    //Brand or trade name
    brand_name: { type: String, required: true, trim: true },

    //Full legal name
    long_name: { type: String, required: true, trim: true },

    //Address
    address: { type: String, trim: true, default: null },

    //Country
    country: { type: String, trim: true, default: null },

    //City
    city: { type: String, trim: true, default: null },

    //Zipcode
    zipcode: { type: String, trim: true, default: null },

    //Students associated with this school
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'student' }],

    //School status
    status: { type: String, enum: ['active', 'deleted', 'suspended'], default: 'active' },

    //Soft-delete timestamp
    deleted_at: { type: Date, default: null },

    //User who deleted this school
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
module.exports = mongoose.model('school', school);
