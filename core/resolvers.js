// *************** IMPORT LIBRARY ***************
const { mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT MODULE ***************
const UserResolvers = require('../modules/user/user.resolver.js');
const SchoolResolvers = require('../modules/school/school.resolver.js');
const StudentResolvers = require('../modules/student/student.resolver.js');

// ***************  Merge all resolvers from modules
const resolvers = mergeResolvers([UserResolvers, SchoolResolvers, StudentResolvers]);

// *************** EXPORT MODULE ***************
module.exports = resolvers;
