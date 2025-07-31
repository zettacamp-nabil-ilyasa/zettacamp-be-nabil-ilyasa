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

  type PagedUsers {
    data: [User]
    pagination_info: PaginationInfo
  }

  input CreateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    role: UserRoleEnum!
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
    role: UserRoleEnum
    sort_by: SortUserByEnum
    sort_order: SortOrderEnum
  }

  enum SortUserByEnum {
    name
    created_at
  }

  enum UserRoleEnum {
    admin
    role
  }

  extend type Query {
    GetAllUsers(pagination: PaginationInput, filter: UserFilterInput): PagedUsers
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
