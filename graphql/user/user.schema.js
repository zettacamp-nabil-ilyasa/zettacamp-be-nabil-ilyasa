// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const userTypeDefs = gql`
  type User {
    # user's document id
    _id: ID!

    # user's first name
    first_name: String!

    # user's last name
    last_name: String!

    # user's email
    email: String!

    # user's password
    password: String!

    # user's role
    role: String!

    # user's student account
    student: Student

    # user's status
    status: Status!

    # user's deletion date for soft delete
    deleted_at: Date

    # user that deleted the user
    deleted_by: ID
  }

  input CreateUserInput {
    # user's first name for create user input
    first_name: String!

    # user's last name for create user input
    last_name: String!

    # user's email for create user input
    email: String!

    # user's password for create user input
    password: String!

    # user's role for create user input
    role: String!
  }

  input UpdateUserInput {
    # user's document id to specify the user
    _id: ID!

    # user's first name for update user input
    first_name: String

    # user's last name for update user input
    last_name: String

    # user's email for update user input
    email: String

    # user's password for update user input
    password: String

    # user's role for update user input
    role: String
  }

  extend type Query {
    GetAllUsers: [User]
    GetOneUser(_id: ID!): User
  }

  extend type Mutation {
    CreateUser(input: CreateUserInput): User
    UpdateUser(input: UpdateUserInput!): User
    DeleteUser(_id: ID!, deletedBy: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;
