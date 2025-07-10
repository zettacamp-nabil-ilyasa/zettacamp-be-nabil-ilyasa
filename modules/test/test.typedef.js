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

  enum TestStatus {
    published
    not_published
    deleted
  }
`;

module.exports = testTypeDefs;
