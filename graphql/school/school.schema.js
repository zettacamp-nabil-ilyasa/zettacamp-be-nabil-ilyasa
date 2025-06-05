// *************** IMPORT LIBRARY *************** 
const {gql} = require('apollo-server')

// *************** 
const schoolTypeDefs = gql`
    type School {
        # school's document id
        id: ID!

        # school's name
        name: String!

        # school's address
        address: String

        # school's students
        students: [Student]

        # school's deletion date for soft delete
        deleted_at: Date
    }

    extend type Query {
        GetAllSchools: [School]
        GetOneSchool(id: ID!): School
    }
    
    extend type Mutation {
        CreateSchool(name: String!, address: String, students: [String]): School
        UpdateSchool(id: ID!, name: String!, address: String, students: [String]): School
        DeleteSchool(id: ID!): School
    }
    `

// *************** EXPORT MODULE *************** 
module.exports = schoolTypeDefs