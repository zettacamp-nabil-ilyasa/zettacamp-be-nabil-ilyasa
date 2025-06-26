// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// ***************
const userTypeDefs = gql`
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

  input CreateUserInput {
    created_by: ID!
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

  input EditRoleInput {
    _id: ID!
    updater_id: ID!
    role: String!
  }

  extend type Query {
    GetAllUsers: [User]
    GetOneUser(_id: ID!): User
  }

  extend type Mutation {
    CreateUser(input: CreateUserInput): User
    UpdateUser(input: UpdateUserInput!): User
    DeleteUser(_id: ID!, deleted_by: ID!): String
    AddRole(input: EditRoleInput): User
    DeleteRole(input: EditRoleInput): User
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;
