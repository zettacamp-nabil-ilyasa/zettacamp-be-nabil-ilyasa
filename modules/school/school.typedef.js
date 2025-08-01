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
    created_at: Date
    updated_at: Date
    created_by: User
    updated_by: User
  }

  type PagedSchools {
    data: [School]
    pagination_info: PaginationInfo
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
    country: String
    student_name: String
  }

  input SchoolSortInput {
    sort_by: SortSchoolByEnum
    sort_order: SortOrderEnum
  }

  enum SortSchoolByEnum {
    long_name
    brand_name
    created_at
  }

  extend type Query {
    GetAllSchools(paginationInput: PaginationInput, filterInput: SchoolFilterInput, sortInput: SchoolSortInput): PagedSchools
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
