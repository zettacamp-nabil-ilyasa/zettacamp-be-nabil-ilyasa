// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

// *************** IMPORT MODULE ***************
const { taskType, taskStatus } = require('../../shared/strings');

const taskSchema = new Schema(
  {
    // test associated with the task
    test_id: { type: Schema.Types.ObjectId, ref: 'test' },

    // user who owns the task
    user_id: { type: Schema.Types.ObjectId, ref: 'user' },

    // student associated with the task
    student_id: { type: Schema.Types.ObjectId, ref: 'student' },

    // student test result associated with the task
    student_test_result_id: { type: Schema.Types.ObjectId, ref: 'student_test_result' },

    // only used in task with assign_corrector type
    corrector_id: { type: Schema.Types.ObjectId, ref: 'user' },

    // type of the task, marks the test lifecycle flow
    type: { type: String, enum: taskType, required: true },

    // status of the task, marks the task lifecycle
    status: { type: String, enum: taskStatus, required: true },

    // due date to complete the task
    due_date: { type: Date },

    // user who created the task
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the task
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // deletion date of the task
    deleted_at: { type: Date },

    // user who deleted the task
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // audit trail to mark the completed date of the task
    completed_at: { type: Date },
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
module.exports = Mongoose.model('task', taskSchema);
