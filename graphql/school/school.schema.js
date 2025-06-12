// *************** IMPORT LIBRARY *************** 
const {gql} = require('apollo-server')

// *************** 
const schoolTypeDefs = gql`
    type School {
        # school's document id
        id: ID!

        # school's brand name
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
        # school's brand name for create school input
        brand_name: String!

        # school's long name for create school input
        long_name: String!

        # school's address for create school input
        address: String
    }

    input UpdateSchoolInput {
        # school's document id to specify the school
        id: ID!

        # school's brand name for update school input
        brand_name: String

        # school's long name for update school input
        long_name: String

        # school's address for update school input
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