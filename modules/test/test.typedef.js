// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const testTypeDefs = gql`
  type Test {
    _id: ID!
    subject_id: Subject!
    name: String
    description: String
    weight: Float!
    notations: [Notation]
    pass_condition: TestPassCondition
    status: TestStatus!
    published_date: Date
    created_at: Date!
    created_by: User
    updated_at: Date!
    updated_by: User
  }

  type Notation {
    notation_text: String
    max_points: Int
  }

  type TestPassCondition {
    parameter_value: Float
    math_operator: MathOperatorEnum
  }

  input NotationInput {
    notation_text: String
    max_points: Int
  }

  input TestInput {
    subject_id: String!
    name: String!
    description: String
    weight: Float!
    notations: [NotationInput]
  }

  input TestFilterInput {
    status: String
    subject_id: String
  }

  input AddTestPassConditionInput {
    parameter_value: Float
    math_operator: MathOperatorEnum
  }

  enum TestStatus {
    published
    not_published
    deleted
  }

  extend type Query {
    GetAllTests(filter: TestFilterInput, pagination: PaginationInput): [Test]
    GetOneTest(_id: ID!): Test
  }

  extend type Mutation {
    CreateTest(input: TestInput): Test
    UpdateTest(_id: ID!, input: TestInput): Test
    AddTestPassCondition(_id: ID!, input: AddTestPassConditionInput): Test
    PublishTest(_id: ID!): Test
    DeleteTest(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = testTypeDefs;
