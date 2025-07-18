// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

// *************** IMPORT MODULE ***************
const { syllabusStatus, parameterEnum, blockSyllabusType, mathOperatorEnum, logicalOperatorEnum } = require('../../shared/strings');

const blockSchema = new Schema(
  {
    // name of the block
    name: { type: String, required: true, trim: true },

    // description of the block
    description: { type: String, trim: true },

    // list of subjects that belongs to the block
    subject_ids: [{ type: Schema.Types.ObjectId, ref: 'subject' }],

    // pass/fail criteria for the block
    pass_conditions: [
      {
        // parameter for pass condition checking (e.g: mark or average_of_marks)
        parameter: { type: String, enum: parameterEnum, trim: true },

        // number to be compared to as pass/fail criteria (e.g: 70 or 80 or 60)
        parameter_value: { type: Number },

        // syllabus used for the condition checking
        syllabus_type: { type: String, enum: blockSyllabusType, trim: true },

        // id of subject, only use if subject is choosed in syllabus_type
        subject_id: { type: Schema.Types.ObjectId, ref: 'subject' },

        // id of subject, only use if test is choosed in syllabus_type
        test_id: { type: Schema.Types.ObjectId, ref: 'test' },

        // math operator for the conditional checking (e.g: greater_than, less_than, etc)
        math_operator: { type: String, enum: mathOperatorEnum, trim: true },

        // logical operator to bind the conditional checking of multiple elements within pass_condition (e.g: and, or)
        logical_operator: { type: String, enum: logicalOperatorEnum, trim: true },
      },
    ],

    // status of the block
    status: { type: String, enum: syllabusStatus, default: 'active', trim: true },

    // user who created the block
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the block
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // Timestamp when the block was marked as deleted
    deleted_at: { type: Date },

    // user who deleted the block
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('block', blockSchema);
