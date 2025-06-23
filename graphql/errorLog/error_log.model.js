// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const error_log = new mongoose.Schema(
  {
    //Name of the error
    error_name: { type: String, required: true, trim: true },

    //Stack of the error
    error_stack: { type: String, required: true, trim: true },

    //Parameter input that caused the error (JSON string)
    parameter_input: { type: String },
  },
  {
    //Timestamp to set up created_at and updated_at
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('error_logs', error_log);
