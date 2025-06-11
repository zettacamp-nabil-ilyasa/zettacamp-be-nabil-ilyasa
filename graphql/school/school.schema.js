// *************** IMPORT LIBRARY *************** 
const {gql} = require('apollo-server')

// *************** 
const schoolTypeDefs = gql`
    type School {
        # school's document id
        id: ID!

        # school's name
        brand_name: String!

        # school's long name
        long_name: String!

        # school's address
        address: String

        # school's students
        students: [Student]

        # school's status
        status: Status!

        # school's deletion date for soft delete
        deleted_at: Date
    }
    
    input CreateSchoolInput {
        brand_name: String!
        long_name: String!
        address: String
    }

    input UpdateSchoolInput {
        id: ID!
        brand_name: String
        long_name: String
        address: String
    }

    extend type Query {
        GetAllSchools: [School]
        GetOneSchool(id: ID!): School
    }
    
    extend type Mutation {
        CreateSchool(input: CreateSchoolInput): School
        UpdateSchool(input: UpdateSchoolInput): School
        DeleteSchool(id: ID!, deletedBy: ID!): String
    }
    `

// *************** EXPORT MODULE *************** 
module.exports = schoolTypeDefs