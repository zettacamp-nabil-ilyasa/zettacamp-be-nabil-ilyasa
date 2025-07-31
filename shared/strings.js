const existenceStatus = ['active', 'deleted', 'archived'];
const testStatus = ['published', 'not_published', 'deleted'];
const studentTestResultStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const taskStatus = ['pending', 'in_progress', 'completed', 'deleted'];
const taskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedTaskStatus = ['pending', 'in_progress', 'completed'];
const allowedTaskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedStudentTestResultStatus = ['completed', 'need_revision', 'validated'];
const taskOwnerUserId = '6862150331861f37e4e3d209';
const parameterEnum = ['average_of', 'mark'];
const mathOperatorEnum = ['greater_than', 'greater_or_equal_than', 'less_than', 'less_or_equal_than', 'equal'];
const logicalOperatorEnum = ['and', 'or'];
const blockSyllabusType = ['block', 'subject', 'test'];
const subjectSyllabusType = ['subject', 'test'];
const gradingResult = ['pass', 'fail'];
const userRole = ['admin', 'student'];
const allowedRolesForGetAllUsers = ['admin'];
const allowedRolesForCreateUser = ['admin'];
const allowedRolesForDeleteUser = ['admin'];
const allowedRolesForCreateSchool = ['admin'];
const allowedRolesForUpdateSchool = ['admin'];
allowedRolesForDeleteSchool = ['admin'];

// *************** EXPORT MODULE ***************
module.exports = {
  existenceStatus,
  testStatus,
  studentTestResultStatus,
  taskStatus,
  taskTypes,
  allowedTaskStatus,
  allowedTaskTypes,
  taskOwnerUserId,
  userRole,
  allowedStudentTestResultStatus,
  parameterEnum,
  mathOperatorEnum,
  logicalOperatorEnum,
  blockSyllabusType,
  subjectSyllabusType,
  gradingResult,
  allowedRolesForGetAllUsers,
  allowedRolesForCreateUser,
  allowedRolesForDeleteUser,
  allowedRolesForCreateSchool,
  allowedRolesForUpdateSchool,
  allowedRolesForDeleteSchool,
};
