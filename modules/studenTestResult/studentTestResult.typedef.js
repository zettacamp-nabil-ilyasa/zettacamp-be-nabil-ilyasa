// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const studentTestResultTypeDefs = gql`
  type StudentTestResult {
    _id: ID!
    student_id: Student
    test_id: Test
    task_id: Task
    marks: [Mark]!
    average_mark: Float!
    status: StudentTestResultStatus!
    mark_entry_date: Date
    created_at: Date!
    updated_at: Date!
  }

  type Mark {
    notation_text: String
    mark: Float
  }

  input MarkInput {
    notation_text: String
    mark: Float
  }

  enum StudentTestResultStatus {
    completed
    need_revision
    validated
    deleted
  }

  input StudentTestResultFilterInput {
    test_id: String
    status: String
  }

  extend type Query {
    GetAllStudentTestResults(filter: StudentTestResultFilterInput, pagination: PaginationInput): [StudentTestResult]
    GetOneStudentTestResult(_id: ID!): StudentTestResult
  }

  extend type Mutation {
    EnterMarks(taskId: ID!, studentMarks: [MarkInput!]): StudentTestResult
    UpdateEnteredMarks(_id: ID!, taskId: ID!, studentMarks: [MarkInput!]): StudentTestResult
    DeleteStudentTestResult(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = studentTestResultTypeDefs;
