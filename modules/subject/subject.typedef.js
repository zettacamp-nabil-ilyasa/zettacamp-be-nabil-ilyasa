// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const subjectTypeDefs = gql`
  type Subject {
    _id: ID!
    block_id: Block!
    name: String!
    description: String
    coefficient: Float!
    pass_conditions: [SubjectPassCondition]
    test_ids: [Test!]
    status: SyllabusStatus!
    created_at: Date!
    created_by: User!
    updated_at: Date!
    deleted_at: Date
    deleted_by: User
  }

  type SubjectPassCondition {
    parameter: ParameterEnum
    parameter_value: Number
    syllabus_type: SubjectSyllabusTypeEnum
    test_id: Test
    math_operator: MathOperatorEnum
    logical_operator: LogicalOperatorEnum
  }

  input AddSubjectPassConditionsInput {
    pass_condition: [SubjectPassConditionInput]
  }

  input SubjectPassConditionInput {
    parameter: ParameterEnum
    parameter_value: Number
    syllabus_type: SubjectSyllabusTypeEnum
    test_id: String
    math_operator: MathOperatorEnum
    logical_operator: LogicalOperatorEnum
  }

  input SubjectInput {
    name: String!
    description: String
    coefficient: Float!
    block_id: String!
  }

  input SubjectFilterInput {
    block_id: String
  }

  enum SubjectSyllabusTypeEnum {
    subject
    type
  }

  extend type Query {
    GetAllSubjects(filter: SubjectFilterInput, pagination: PaginationInput): [Subject]
    GetOneSubject(_id: ID!): Subject
  }

  extend type Mutation {
    CreateSubject(input: SubjectInput): Subject
    UpdateSubject(_id: ID!, input: SubjectInput): Subject
    AddSubjectPassCondition(_id: ID!, input: AddSubjectPassConditionsInput): Subject
    DeleteSubject(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = subjectTypeDefs;
