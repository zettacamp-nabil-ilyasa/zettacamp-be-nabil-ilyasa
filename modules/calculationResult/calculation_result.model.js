// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

// *************** IMPORT MODULE ***************
const { gradingResult, calculationResultStatus } = require('../../shared/strings');

const calculationResultSchema = new Schema(
  {
    // id of student who owns the calculation result
    student_id: { type: Schema.Types.ObjectId, ref: 'student' },

    // grading result calculated from block, subject, and test's pass conditions (e,g: pass, fail)
    overall_result: { type: String, enum: gradingResult, trim: true },

    // results calculated from all blocks, subjects, and tests that belongs to the student
    results: [
      {
        // id of block associated with student's test result
        block_id: { type: Schema.Types.ObjectId, ref: 'block' },

        /// grading result of the block (e.g: pass, fail)
        block_result: { type: String, enum: gradingResult, trim: true },

        // total marks of block
        total_marks: { type: Number },

        // result of subjects associated with block
        subject_results: [
          {
            // id of subject associated with student's test result
            subject_id: { type: Schema.Types.ObjectId, ref: 'subject' },

            // grading result of the subject (e.g: pass, fail)
            subject_result: { type: String, enum: gradingResult, trim: true },

            /// total marks of subject
            total_marks: { type: Number },

            // result of tests associated with subject
            test_results: [
              {
                // id of test associated with student's test result
                test_id: { type: Schema.Types.ObjectId, ref: 'test' },

                // grading result of the test (e.g: pass, fail)
                test_result: { type: String, enum: gradingResult, trim: true },

                // average mark of test's notations
                average_mark: { type: Number },

                // average mark of test's notations after applying the test's weight
                weighted_mark: { type: Number },
              },
            ],
          },
        ],
      },
    ],

    // status of the calculation result
    status: { type: String, enum: calculationResultStatus, default: 'active', trim: true },

    // user who triggers the calculation result
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // Timestamp when the calculation result was marked as deleted
    deleted_at: { type: Date },

    // user who deleted the calculation result
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
module.exports = Mongoose.model('calculation_result', calculationResultSchema);
