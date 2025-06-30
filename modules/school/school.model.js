// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const school = new mongoose.Schema(
  {
    //Brand or trade name
    brand_name: { type: String, required: true, trim: true },

    //Full legal name
    long_name: { type: String, required: true, trim: true },

    //Address
    address: { type: String, trim: true },

    //Country
    country: { type: String, trim: true },

    //City
    city: { type: String, trim: true },

    //Zipcode
    zipcode: { type: String, trim: true },

    //Students associated with this school
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'student' }],

    //School status
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
module.exports = mongoose.model('school', school);
