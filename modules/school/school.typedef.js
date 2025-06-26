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
    deleted_at: Date
  }

  input CreateSchoolInput {
    created_by: ID
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
    DeleteSchool(_id: ID!, deleted_by: ID): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = schoolTypeDefs;
