// *************** IMPORT LIBRARY *************** 
const {gql} = require('apollo-server')

// *************** 
const userTypeDefs = gql`   

    type User {
        # user's document id
        id: ID!

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
        first_name: String!
        last_name: String!
        email: String!
        password: String!
        role: String!
    }

    input UpdateUserInput {
        id: ID!
        first_name: String
        last_name: String
        email: String
        password: String
        role: String
    }
    
    extend type Query {
        GetAllUsers: [User]
        GetOneUser(id: ID!): User
    }

    extend type Mutation {
    CreateUser(input: CreateUserInput): User
    UpdateUser(input: UpdateUserInput!): User
    DeleteUser(id: ID!, deletedBy: ID!): String
    }`

// *************** EXPORT MODULE *************** 
module.exports = userTypeDefs
