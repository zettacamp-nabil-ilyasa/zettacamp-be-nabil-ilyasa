// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const errorLogSchema = new Schema(
  {
    // Stack of the error
    error_stack: { type: String, required: true, trim: true },

    // Parameter input that caused the error (JSON string)
    parameter_input: { type: String },

    // Name of the function that caused the error
    function_name: { type: String, required: true, trim: true },

    // Path of the file that caused the error
    path: { type: String, required: true, trim: true },
  },
  {
    // Timestamp to set up created_at and updated_at
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('error_log', errorLogSchema);
