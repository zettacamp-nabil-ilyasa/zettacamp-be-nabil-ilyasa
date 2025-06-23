// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const userTypeDefs = gql`
  type User {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    roles: [Role!]
    student: Student
    status: Status!
    deleted_at: Date
    deleted_by: ID
    created_at: Date
    updated_at: Date
  }

  input CreateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    password: String!
  }

  input UpdateUserInput {
    _id: ID!
    first_name: String
    last_name: String
    email: String
    password: String
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
    DeleteUser(_id: ID!, deletedBy: ID!): String
    AddRole(input: EditRoleInput): User
    DeleteRole(input: EditRoleInput): User
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;
