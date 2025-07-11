// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const testTypeDefs = gql`
  type Test {
    _id: ID!
    subject_id: Subject!
    name: String!
    description: String
    weight: Number!
    notations: [Notation]
    status: Status!
    created_at: Date!
    created_by: User!
    updated_at: Date!
  }

  type Notation {
    notation_text: String
    max_points: Number
  }

  input TestInput {
    subject_id: String
    name: String!
    description: String
    weight: Number!
    notations: [Notation]
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

  extend type Query{
    GetAllTests(filter: TestFilterInput, pagination: PaginationInput): [Test]
    GetOneTest(_id: ID!): Test
  }

  extend type Mutation{
    CreateTest(TestInput): Test
    UpdateTest(TestInput): Test
    DeleteTest(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = testTypeDefs;
