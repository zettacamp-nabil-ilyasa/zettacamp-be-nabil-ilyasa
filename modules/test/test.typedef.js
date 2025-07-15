// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const testTypeDefs = gql`
  type Test {
    _id: ID!
    subject_id: Subject!
    name: String!
    description: String
    weight: Float!
    notations: [Notation]
    status: TestStatus!
    published_date: Date
    created_at: Date!
    created_by: User!
    updated_at: Date!
  }

  type Notation {
    notation_text: String
    max_points: Int
  }

  input NotationInput {
    notation_text: String
    max_points: Int
  }

  input TestInputForCreate {
    subject_id: String!
    name: String!
    description: String
    weight: Float!
    notations: [NotationInput]
  }

  input TestInputForUpdate {
    name: String!
    description: String
    weight: Float!
    notations: [NotationInput]!
  }

  input TestFilterInput {
    status: String
    subject_id: String
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
    CreateTest(input: TestInputForCreate): Test
    UpdateTest(_id: ID!, input: TestInputForUpdate): Test
    PublishTest(_id: ID!): Test
    DeleteTest(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = testTypeDefs;
