// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const calculationResultTypeDefs = gql`
  type CalculationResult {
    student_id: Student
    overall_result: GradingResultEnum
    results: [BlockResult]
    status: CalculationResultStatus
    created_at: Date
    created_by: User
    updated_at: Date
    updated_by: User
    deleted_at: Date
    deleted_by: User
  }

  type BlockResult {
    block_id: Block
    block_result: GradingResultEnum
    total_marks: Float
    subject_results: [SubjectResult]
  }

  type SubjectResult {
    subject_id: Subject
    subject_result: GradingResultEnum
    total_marks: Float
    test_results: [TestResult]
  }

  type TestResult {
    test_id: Test
    test_result: GradingResultEnum
    average_mark: Float
    weighted_mark: Float
  }

  enum GradingResultEnum {
    pass
    fail
  }

  enum CalculationResultStatus {
    active
    deleted
    archived
  }

  extend type Query {
    GetAllCalculationResults: [CalculationResult]
    GetOneCalculationResult(_id: ID!): CalculationResult
  }
`;

// *************** EXPORT MODULE ***************
module.exports = calculationResultTypeDefs;
