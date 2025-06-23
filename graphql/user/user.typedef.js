// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const userTypeDefs = gql`
  type User {
    # Document id
    _id: ID!

    # First name
    first_name: String!

    # Last name
    last_name: String!

    # Email
    email: String!

    # Roles
    roles: [Role!]

    # reference to student who is associated with this user
    student: Student

    # Status
    status: Status!

    # Soft-delete timestamp
    deleted_at: Date

    # reference to user who deleted this user
    deleted_by: ID
  }

  input CreateUserInput {
    # First name for create user input
    first_name: String!

    # Last name for create user input
    last_name: String!

    # Email for create user input
    email: String!

    # Password for create user input
    password: String!
  }

  input UpdateUserInput {
    # User document id to specify the user
    _id: ID!

    # First name for update user input
    first_name: String

    # Last name for update user input
    last_name: String

    # Email for update user input
    email: String

    # Password for update user input
    password: String
  }

  input EditRole {
    # Document id of user whose role is to be changed
    _id: ID!

    # Document id of user that wants to change role
    updaterId: ID!

    # Role to be added or removed
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
    AddRole(input: EditRole): User
    DeleteRole(input: EditRole): User
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;
