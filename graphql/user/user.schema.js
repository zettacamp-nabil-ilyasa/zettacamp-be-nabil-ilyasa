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

        # user's deletion date for soft delete
        deleted_at: Date
    }
    
    extend type Query {
        Users: [User]
        User(id: ID!): User
    }

    extend type Mutation {
    CreateUser(first_name: String!, last_name: String!, email: String!, password: String!, role: String!): User
    UpdateUser(id: ID!, first_name: String!, last_name: String!, email: String!, password: String!, role: String!): User
    DeleteUser(id: ID!): User
    }`

// *************** EXPORT MODULE *************** 
module.exports = userTypeDefs
