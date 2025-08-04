// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

// *************** IMPORT MODULE ***************
const { studentTestResultStatus } = require('../../shared/strings');

const studentTestResultSchema = new Schema(
  {
    // student associated with the studenttestresult
    student_id: { type: Schema.Types.ObjectId, required: true, ref: 'student' },

    // test associated with the studenttestresult
    test_id: { type: Schema.Types.ObjectId, required: true, ref: 'test' },

    // task associated with the studenttestresult
    task_id: { type: Schema.Types.ObjectId, required: true, ref: 'task' },

    // array of mark containing notation_text and mark
    marks: [
      {
        // notation or text related to the mark
        notation_text: { type: String, trim: true },

        // mark of the student
        mark: { type: Number, required: true },
      },
    ],

    // average of all marks in the studenttestresult
    average_mark: { type: Number, required: true },

    // status of the studenttestresult
    status: { type: String, enum: studentTestResultStatus, required: true },

    // date when the studenttestresult marked/graded
    mark_entry_date: { type: Date },

    // date when the studenttestresult validated
    mark_validated_date: { type: Date },

    // user who created the studenttestresult
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the student test result
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // date when the studenttestresult is deleted
    deleted_at: { type: Date },

    // user who created the block
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
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
module.exports = Mongoose.model('student_test_result', studentTestResultSchema);
