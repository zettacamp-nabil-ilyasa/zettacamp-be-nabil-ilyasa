// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const userTypeDefs = gql`
  type User {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    role: String!
    status: Status!
    createdAt: Date
    created_by: User
    updatedAt: Date
  }

  type UserLoggedIn {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    role: String!
    access_token: String!
  }

  input CreateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    role: String!
  }

  input UpdateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UserFilterInput {
    sort_by: SortUserByEnum
    sort_order: SortOrderEnum
    limit: Int
    offset: Int
    page: Int
  }

  enum SortUserByEnum {
    name
    created_at
  }

  extend type Query {
    GetAllUsers: [User]
    GetOneUser(_id: ID!): User
  }

  extend type Mutation {
    CreateUser(input: CreateUserInput): User
    UserLogin(input: LoginInput): UserLoggedIn
    UpdateUser(_id: ID!, input: UpdateUserInput!): User
    DeleteUser(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;
