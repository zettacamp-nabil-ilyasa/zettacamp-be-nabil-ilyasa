const syllabusStatus = ['active', 'deleted', 'archived'];
const testStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const studentTestResultStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const taskStatus = ['pending', 'in_progress', 'completed', 'deleted'];
const taskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedTaskStatus = ['pending', 'in_progress', 'completed'];
const allowedTaskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedStudentTestResultStatus = ['completed', 'need_revision', 'validated'];
const taskOwnerUserId = '6862150331861f37e4e3d209';

// *************** EXPORT MODULE ***************
module.exports = {
  syllabusStatus,
  testStatus,
  studentTestResultStatus,
  taskStatus,
  taskTypes,
  allowedTaskStatus,
  allowedTaskTypes,
  taskOwnerUserId,
  allowedStudentTestResultStatus,
};
