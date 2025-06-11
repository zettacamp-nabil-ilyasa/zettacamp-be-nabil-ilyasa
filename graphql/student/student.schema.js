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

        # student's user id
        user_id: ID

        # student's school
        school_id: ID!

        # student's status
        status: Status!
        
        # student's deletion date for soft delete
        deleted_at: Date

        # student's deleted by
        deleted_by: ID
        }

    input CreateStudentInput {
        first_name: String!
        last_name: String!
        email: String!
        date_of_birth: Date
        school_id: String!
    }

    input CreateStudentWithUserInput {
        first_name: String!
        last_name: String!
        email: String!
        password: String!
        date_of_birth: Date
        school_id: String!
    }

    input UpdateStudentInput {
        id: ID!
        first_name: String
        last_name: String
        email: String
        date_of_birth: Date
        school_id: String
    }
    
    extend type Query {
        GetAllStudents: [Student]
        GetOneStudent(id: ID!): Student
    }

    extend type Mutation {
        CreateStudent(input: CreateStudentInput): Student
        CreateUserWithStudent(input: CreateStudentWithUserInput): Student
        UpdateStudent(input: UpdateStudentInput): Student
        DeleteStudent(id: ID!, deletedBy: ID!): String!
    }
`

// *************** EXPORT MODULE *************** 
module.exports = studentTypeDefs