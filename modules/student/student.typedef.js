// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

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

  input StudentInput {
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: Date
    school_id: String
  }

  input StudentFilterInput {
    school_id: String
    student_name: String
    school_long_name: String
    date_of_birth: String
    date_comparation_operator: MathOperatorEnum
  }

  input StudentSortInput {
    sort_by: SortStudentByEnum
    sort_order: SortOrderEnum
  }

  enum SortStudentByEnum {
    first_name
    last_name
    school_long_name
    date_of_birth
    created_at
  }

  extend type Query {
    GetAllStudents(paginationInput: PaginationInput, filterInput: StudentFilterInput, sortInput: StudentSortInput): [Student]
    GetOneStudent(_id: ID!): Student
  }

  extend type Mutation {
    CreateStudent(input: StudentInput): Student
    UpdateStudent(_id: ID!, input: StudentInput): Student
    DeleteStudent(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = studentTypeDefs;
