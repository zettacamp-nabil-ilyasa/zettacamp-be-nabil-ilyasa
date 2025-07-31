// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { gql } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserTypeDefs = require('../modules/user/user.typedef.js');
const SchoolTypeDefs = require('../modules/school/school.typedef.js');
const StudentTypeDefs = require('../modules/student/student.typedef.js');
const BlockTypeDefs = require('../modules/block/block.typedef.js');
const SubjectTypeDefs = require('../modules/subject/subject.typedef.js');
const TestTypeDefs = require('../modules/test/test.typedef.js');
const StudentTestResultTypeDefs = require('../modules/studentTestResult/studentTestResult.typedef.js');
const TaskTypeDefs = require('../modules/task/task.typedef.js');
const CalculationResultTypeDefs = require('../modules/calculationResult/calculation_result.typedef.js');

// *************** base typedef
const baseTypeDefs = gql`
  scalar Date

  enum Status {
    active
    deleted
    archived
  }

  enum SyllabusStatus {
    active
    deleted
    archived
  }

  enum ParameterEnum {
    average_of
    mark
  }

  enum MathOperatorEnum {
    greater_than
    greater_or_equal_than
    less_than
    less_or_equal_than
    equal
  }

  enum LogicalOperatorEnum {
    and
    or
  }

  enum SortOrderBy {
    asc
    desc
  }

  input PaginationInput {
    limit: Int
    offset: Int
  }

  type Query
  type Mutation
`;

// *************** merge base typedef with all typedefs from modules
const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  UserTypeDefs,
  SchoolTypeDefs,
  StudentTypeDefs,
  BlockTypeDefs,
  SubjectTypeDefs,
  TestTypeDefs,
  StudentTestResultTypeDefs,
  TaskTypeDefs,
  CalculationResultTypeDefs,
]);

// *************** EXPORT MODULE ***************
module.exports = typeDefs;
