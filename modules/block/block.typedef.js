// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const blockTypeDefs = gql`
  type Block {
    _id: ID!
    name: String!
    description: String
    subject_ids: [Subject]
    status: Status!
    created_at: Date!
    created_by: String
    updated_at: Date!
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  input BlockInput {
    name: String!
    description: String
  }

  enum Status {
    active
    deleted
    archived
  }

  extend type Query {
    GetAllBlocks: [Block]
    GetOneBlock(_id: ID!): Block
  }

  extend type Mutation {
    CreateBlock(input: BlockInput): Block
    UpdateBlock(_id: ID!, input: BlockInput): Block
    DeleteBlock(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = blockTypeDefs;
