// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { gql } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const userTypeDefs = require('../modules/user/user.typedef.js');
const schoolTypeDefs = require('../modules/school/school.typedef.js');
const studentTypeDefs = require('../modules/student/student.typedef.js');

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
const TypeDefs = mergeTypeDefs([baseTypeDefs, userTypeDefs, schoolTypeDefs, studentTypeDefs]);

// *************** EXPORT MODULE ***************
module.exports = TypeDefs;
