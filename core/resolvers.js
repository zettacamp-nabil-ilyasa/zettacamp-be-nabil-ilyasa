// *************** IMPORT LIBRARY ***************
const { mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT MODULE ***************
const UserResolvers = require('../modules/user/user.resolver.js');
const SchoolResolvers = require('../modules/school/school.resolver.js');
const StudentResolvers = require('../modules/student/student.resolver.js');
const BlockResolvers = require('../modules/block/block.resolver.js');
const SubjectResolvers = require('../modules/subject/subject.resolver.js');
const TestResolvers = require('../modules/test/test.resolver.js');
const StudentTestResultResolvers = require('../modules/studenTestResult/student_test_result.resolver.js');
const TaskResolvers = require('../modules/task/task.resolver.js');

// ***************  Merge all resolvers from modules
const resolvers = mergeResolvers([
  UserResolvers,
  SchoolResolvers,
  StudentResolvers,
  BlockResolvers,
  SubjectResolvers,
  TestResolvers,
  StudentTestResultResolvers,
  TaskResolvers,
]);

// *************** EXPORT MODULE ***************
module.exports = resolvers;
