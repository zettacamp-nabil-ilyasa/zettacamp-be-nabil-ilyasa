const syllabusStatus = ['active', 'deleted', 'archived'];
const testStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const studentTestResultStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const taskStatus = ['pending', 'in_progress', 'completed', 'deleted'];
const taskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedTaskStatus = ['pending', 'in_progress', 'completed'];
const allowedTaskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedStudentTestResultStatus = ['completed', 'need_revision', 'validated'];
const taskOwnerUserId = '6862150331861f37e4e3d209';
const parameterEnum = ['mark', 'average_of_marks'];
const mathOperatorEnum = ['greater_than', 'greater_or_equal_than', 'less_than', 'less_or_equal_than', 'equal'];
const logicalOperatorEnum = ['and', 'or'];
const blockSyllabusType = ['block', 'subject', 'test'];
const subjectSyllabusType = ['subject', 'test'];
const gradingResult = ['pass', 'fail'];
const calculationResultStatus = ['active', 'deleted', 'archived'];

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
  parameterEnum,
  mathOperatorEnum,
  logicalOperatorEnum,
  blockSyllabusType,
  subjectSyllabusType,
  gradingResult,
  calculationResultStatus,
};
