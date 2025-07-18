// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

// *************** IMPORT MODULE ***************
const { syllabusStatus } = require('../../shared/strings');

const subjectSchema = new Schema(
  {
    // name of subject
    name: { type: String, required: true, trim: true },

    // description of subject
    description: { type: String, trim: true },

    // coefficient for calculation factor (currently unused)
    coefficient: { type: Number, required: true },

    // block associated with the subject
    block_id: { type: Schema.Types.ObjectId, required: true, ref: 'block' },

    // pass/fail criteria for the subject
    pass_conditions: [
      {
        // parameter for pass condition checking (e.g: mark or average_of_marks)
        parameter: { type: String, enum: parameterEnum, trim: true },

        // number to be compared to as pass/fail criteria (e.g: 70 or 80 or 60)
        parameter_value: { type: Number },

        // syllabus used for the condition checking
        syllabus_type: { type: String, enum: subjectSyllabusType, trim: true },

        // id of test, only used if test is choosed in syllabus_type
        test_id: { type: Schema.Types.ObjectId, ref: 'test' },

        // math operator for the conditional checking (e.g: greater_than, less_than, etc)
        math_operator: { type: String, enum: MathOperatorEnum, trim: true },

        // logical operator to bind the conditional checking of multiple elements within pass_condition (e.g: and, or)
        logical_operator: { type: String, enum: logicalOperatorEnum, trim: true },
      },
    ],

    // tests associated with the subject
    test_ids: [{ type: Schema.Types.ObjectId, ref: 'test' }],

    // status of the subject
    status: { type: String, enum: syllabusStatus, default: 'active' },

    // user who created the subject
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the subject
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // deletion date of the subject
    deleted_at: { type: Date },

    // user who deleted the subject
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
module.exports = Mongoose.model('subject', subjectSchema);
