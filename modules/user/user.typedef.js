// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// ***************
const userTypeDefs = gql`
  enum Role {
    admin
    user
  }

  type User {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    roles: [Role!]
    status: Status!
    deleted_at: Date
    deleted_by: ID
    createdAt: Date
    created_by: User
    updatedAt: Date
  }

  input UserInput {
    first_name: String!
    last_name: String!
    email: String!
  }

  input UpdateUserInput {
    _id: ID!
    first_name: String
    last_name: String
    email: String
  }

  extend type Query {
    GetAllUsers: [User]
    GetOneUser(_id: ID!): User
  }

  extend type Mutation {
    CreateUser(input: UserInput): User
    UpdateUser(input: _id: ID!, UserInput!): User
    DeleteUser(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;
