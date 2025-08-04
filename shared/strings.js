const existenceStatus = ['active', 'deleted', 'archived'];
const testStatus = ['published', 'not_published', 'deleted'];
const studentTestResultStatus = ['completed', 'validated', 'need_revision', 'deleted'];
const taskStatus = ['pending', 'in_progress', 'completed', 'deleted'];
const taskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedTaskStatus = ['pending', 'in_progress', 'completed'];
const allowedTaskTypes = ['assign_corrector', 'validate_marks', 'enter_marks'];
const allowedStudentTestResultStatus = ['completed', 'need_revision', 'validated'];
const parameterEnum = ['average_of', 'mark'];
const mathOperatorEnum = ['greater_than', 'greater_or_equal_than', 'less_than', 'less_or_equal_than', 'equal'];
const logicalOperatorEnum = ['and', 'or'];
const blockSyllabusType = ['block', 'subject', 'test'];
const subjectSyllabusType = ['subject', 'test'];
const gradingResult = ['pass', 'fail'];
const userRole = ['admin', 'student'];
const allowedRoles = {
  User: {
    GetAllUsers: ['admin'],
    CreateUser: ['admin'],
    UpdateUser: ['admin'],
    DeleteUser: ['admin'],
  },
  School: {
    GetAllSchools: ['admin'],
    CreateSchool: ['admin'],
    UpdateSchool: ['admin'],
    DeleteSchool: ['admin'],
  },
  Student: {
    GetAllStudents: ['admin'],
    CreateStudent: ['admin'],
    UpdateStudent: ['admin'],
    DeleteStudent: ['admin'],
  },
  Block: {
    GetAllBlocks: ['admin'],
    CreateBlock: ['admin'],
    UpdateBlock: ['admin'],
    AddBlockPassConditions: ['admin'],
    DeleteBlock: ['admin'],
  },
  Subject: {
    GetAllSubjects: ['admin'],
    CreateSubject: ['admin'],
    UpdateSubject: ['admin'],
    AddSubjectPassConditions: ['admin'],
    DeleteSubject: ['admin'],
  },
  Test: {
    GetAllTests: ['admin'],
    CreateTest: ['admin'],
    UpdateTest: ['admin'],
    AddTestPassCondition: ['admin'],
    PublishTest: ['admin'],
    DeleteTest: ['admin'],
  },
  StudentTestResult: {
    GetAllStudentTestResults: ['admin'],
    EnterMarks: ['admin'],
    UpdateEnteredMarks: ['admin'],
    DeleteStudentTestResult: ['admin'],
  },
  Task: {
    GetAllTasks: ['admin'],
    AssignCorrector: ['admin'],
    ValidateMarks: ['admin'],
    DeleteTask: ['admin'],
  },
  CalculationResult: {
    GetAllCalculationResults: ['admin'],
  },
};

// *************** EXPORT MODULE ***************
module.exports = {
  existenceStatus,
  testStatus,
  studentTestResultStatus,
  taskStatus,
  taskTypes,
  allowedTaskStatus,
  allowedTaskTypes,
  userRole,
  allowedStudentTestResultStatus,
  parameterEnum,
  mathOperatorEnum,
  logicalOperatorEnum,
  blockSyllabusType,
  subjectSyllabusType,
  gradingResult,
  allowedRoles,
};
