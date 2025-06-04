// *************** IMPORT LIBRARY *************** 
const {gql} = require('apollo-server')

// ***************
const studentTypeDefs = gql`
    type Student {
        # student's document id
        id: ID!

        # student's first name
        first_name: String!

        # student's last name
        last_name: String!

        # student's email
        email: String!

        # student's date of birth
        date_of_birth: Date

        # student's school
        school_id: String!
        
        # student's deletion date for soft delete
        deleted_at: Date
        }
    
    extend type Query {
        Students: [Student]
        Student(id: ID!): Student
    }

    extend type Mutation {
        CreateStudent(first_name: String!, last_name: String!, email: String!, date_of_birth: Date, school_id: String!): Student
        UpdateStudent(id: ID!, first_name: String!, last_name: String!, email: String!, date_of_birth: Date, school_id: String!): Student
        DeleteStudent(id: ID!): Student
    }
`

// *************** EXPORT MODULE *************** 
module.exports = studentTypeDefs