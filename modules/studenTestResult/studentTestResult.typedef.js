// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const studentTestResultTypeDefs = gql`
  type StudentTestResult {
    student_id: String!
    test_id: String!
    task_id: String!
    marks: [Mark]
    average_mark: Number
    status: StudentTestResultStatus!
    mark_entry_date: Date
    created_at: Date!
    created_by: User
    updated_at: Date!
  }

  type Mark {
    notation_text: String
    mark: Number
  }

  enum StudentTestResultStatus {
    completed
    needs_revision
    validated
    deleted
  }

  input StudentTestResultInput {
    test_id: String
    student_id: String
    task_id: String
    marks: [Mark]
  }

  input StudentTestResultFilterInput {
    test_id: String
    status: String
  }

  extend type Query {
    GetAllStudentTestResult(filter: StudentTestResultFilterInput, pagination: PaginationInput): [StudentTestResult]
    GetOneStudentTestResult(_id: ID!): StudentTestResult
  }

  extend type Mutation {
    DeleteStudentTestResult(_id: ID!): String
  }

  // *************** EXPORT MODULE ***************
module.exports = studentTestResultTypeDefs;
`;
