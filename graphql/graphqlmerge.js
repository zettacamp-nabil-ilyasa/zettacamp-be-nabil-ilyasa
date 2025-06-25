// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { gql } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const userTypeDefs = require('./user/user.typedef.js');
const userResolvers = require('./user/user.resolver.js');
const schoolTypeDefs = require('./school/school.typedef.js');
const schoolResolvers = require('./school/school.resolver.js');
const studentTypeDefs = require('./student/student.typedef.js');
const studentResolvers = require('./student/student.resolver.js');

const baseTypeDefs = gql`
  scalar Date

  enum Status {
    active
    deleted
    suspended
  }

  enum Role {
    admin
    user
  }

  type Query
  type Mutation
`;

const TypeDefs = mergeTypeDefs([baseTypeDefs, userTypeDefs, schoolTypeDefs, studentTypeDefs]);
const Resolvers = mergeResolvers([userResolvers, schoolResolvers, studentResolvers]);

// *************** EXPORT MODULE ***************
module.exports = { TypeDefs, Resolvers };
