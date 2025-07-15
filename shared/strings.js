const syllabusStatus = ['active', 'deleted', 'archived'];
const testStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const studentTestResultStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const taskStatus = ['pending', 'in_progress', 'completed', 'deleted'];
const taskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];

// *************** EXPORT MODULE ***************
module.exports = { syllabusStatus, testStatus, studentTestResultStatus, taskStatus, taskTypes };
