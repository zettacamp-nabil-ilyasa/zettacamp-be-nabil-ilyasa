// *************** IMPORT LIBRARY ***************
const { mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT MODULE ***************
const userResolvers = require('../modules/user/user.resolver.js');
const schoolResolvers = require('../modules/school/school.resolver.js');
const studentResolvers = require('../modules/student/student.resolver.js');

// ***************  Merge all resolvers from modules
const Resolvers = mergeResolvers([userResolvers, schoolResolvers, studentResolvers]);

// *************** EXPORT MODULE ***************
module.exports = Resolvers;
