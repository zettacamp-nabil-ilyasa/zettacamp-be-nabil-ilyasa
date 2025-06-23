// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const studentTypeDefs = gql`
  type Student {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: Date
    school: School!
    school_id: ID
    user: User
    user_id: ID
    status: Status!
    deleted_at: Date
    deleted_by: ID
    created_at: Date
    updated_at: Date
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
    _id: ID!
    first_name: String
    last_name: String
    email: String
    date_of_birth: Date
    school_id: String
  }

  extend type Query {
    GetAllStudents: [Student]
    GetOneStudent(_id: ID!): Student
  }

  extend type Mutation {
    CreateStudent(input: CreateStudentInput): Student
    CreateStudentWithUser(input: CreateStudentWithUserInput): Student
    UpdateStudent(input: UpdateStudentInput): Student
    DeleteStudent(_id: ID!, deletedBy: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = studentTypeDefs;
