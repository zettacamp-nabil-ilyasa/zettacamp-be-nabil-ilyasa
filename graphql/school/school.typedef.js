// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const schoolTypeDefs = gql`
  type School {
    # Document id
    _id: ID!
    brand_name: String!
    long_name: String!
    address: String
    country: String
    city: String
    zipcode: String
    students: [Student]
    status: Status!
    deleted_at: Date
    deleted_by: ID!
    created_at: Date
    updated_at: Date
  }

  input CreateSchoolInput {
    brand_name: String!
    long_name: String!
    address: String
    country: String
    city: String
    zipcode: String
  }

  input UpdateSchoolInput {
    _id: ID!
    brand_name: String
    long_name: String
    address: String
    country: String
    city: String
    zipcode: String
  }

  extend type Query {
    GetAllSchools: [School]
    GetOneSchool(_id: ID!): School
  }

  extend type Mutation {
    CreateSchool(input: CreateSchoolInput): School
    UpdateSchool(input: UpdateSchoolInput): School
    DeleteSchool(_id: ID!, deletedBy: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = schoolTypeDefs;
