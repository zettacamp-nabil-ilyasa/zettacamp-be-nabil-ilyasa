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

        # student's school_id to set the student's relation with a school
        school_id: ID!

        # student's status
        status: Status!
        
        # student's deletion date for soft delete
        deleted_at: Date

        # student's deleted by
        deleted_by: ID
        }

    input CreateStudentInput {
        # student's first name for create student input
        first_name: String!

        # student's last name for create student input
        last_name: String!

        # student's email for create student input
        email: String!

        # student's date of birth for create student input
        date_of_birth: Date

        # student's school id for create student input
        school_id: String!
    }

    input CreateStudentWithUserInput {
        # student's first name for create student with user input
        first_name: String!

        # student's last name for create student with user input
        last_name: String!

        # student's email for create student with user input
        email: String!

        # student's password for create student with user input
        password: String!

        # student's date of birth for create student with user input
        date_of_birth: Date

        # student's school id for create student with user input
        school_id: String!
    }

    input UpdateStudentInput {
        # student's document id to specify the student
        id: ID!

        # student's first name for update student input
        first_name: String

        # student's last name for update student input
        last_name: String

        # student's email for update student input
        email: String

        # student's date of birth for update student input
        date_of_birth: Date

        # student's school id for update student input
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