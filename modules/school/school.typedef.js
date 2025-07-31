// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const schoolTypeDefs = gql`
  type School {
    _id: ID!
    brand_name: String!
    long_name: String!
    address: String
    country: String
    city: String
    zipcode: String
    students: [Student]
    status: Status!
    createdAt: Date
    updatedAt: Date
    created_by: User
  }

  input SchoolInput {
    brand_name: String!
    long_name: String!
    address: String
    country: String
    city: String
    zipcode: String
  }

  input SchoolFilterInput {
    sort_by: SortSchoolByEnum
    sort_order: SortOrderEnum
    country: String
    student_last_name: String
    student_first_name: String
    limit: Int
    offset: Int
    page: Int
  }

  enum SortSchoolByEnum {
    long_name
    brand_name
    created_at
  }

  extend type Query {
    GetAllSchools: [School]
    GetOneSchool(_id: ID!): School
  }

  extend type Mutation {
    CreateSchool(input: SchoolInput): School
    UpdateSchool(_id: ID!, input: SchoolInput): School
    DeleteSchool(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = schoolTypeDefs;
