// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { gql } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserTypeDefs = require('../modules/user/user.typedef.js');
const SchoolTypeDefs = require('../modules/school/school.typedef.js');
const StudentTypeDefs = require('../modules/student/student.typedef.js');

// *************** base typedef
const baseTypeDefs = gql`
  scalar Date

  enum Status {
    active
    deleted
  }

  type Query
  type Mutation
`;

// *************** merge base typedef with all typedefs from modules
const typeDefs = mergeTypeDefs([baseTypeDefs, UserTypeDefs, SchoolTypeDefs, StudentTypeDefs]);

// *************** EXPORT MODULE ***************
module.exports = typeDefs;
