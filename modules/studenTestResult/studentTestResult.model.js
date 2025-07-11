// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const studentTestResultSchema = new Schema(
  {
    // student associated with the studenttestresult
    student_id: { type: Schema.Types.ObjectId, required: true },

    // test associated with the studenttestresult
    test_id: { type: Schema.Types.ObjectId, required: true },

    // task associated with the studenttestresult
    task_id: { type: Schema.Types.ObjectId, required: true },

    // average of all marks in the studenttestresult
    average_mark: { type: Schema.Types.ObjectId, required: true },

    // status of the studenttestresult
    status: { type: String, enum: ['completed', 'validated', 'need_revision', 'deleted'], required: true },

    // date when the studenttestresult marked/graded
    mark_entry_date: { type: Date },

    // date when the studenttestresult validated
    mark_validated_date: { type: Date },

    // user who created the studenttestresult
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the studenttestresult
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // date when the studenttestresult is deleted
    deleted_at: { type: Date },

    // user who created the block
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: {
      createdAt: created_at,
      updatedAt: updated_at,
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('student_test_result', studentTestResultSchema);
