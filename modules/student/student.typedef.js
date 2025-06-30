// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// ***************
const studentTypeDefs = gql`
  type Student {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: Date
    school_id: School!
    status: Status!
    created_by: User
    createdAt: Date
    updatedAt: Date
  }

  input CreateStudentInput {
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: Date
  }

  input UpdateStudentInput {
    _id: ID!
    first_name: String
    last_name: String
    email: String
    date_of_birth: Date
  }

  extend type Query {
    GetAllStudents: [Student]
    GetOneStudent(_id: ID!): Student
  }

  extend type Mutation {
    CreateStudent(input: CreateStudentInput): Student
    UpdateStudent(input: UpdateStudentInput): Student
    DeleteStudent(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = studentTypeDefs;
