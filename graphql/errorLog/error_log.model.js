// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const error_log = new mongoose.Schema(
  {
    error_name: { type: String, required: true, trim: true },
    error_stack: { type: String, required: true, trim: true },
    parameter_input: { type: String },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('error_logs', error_log);
