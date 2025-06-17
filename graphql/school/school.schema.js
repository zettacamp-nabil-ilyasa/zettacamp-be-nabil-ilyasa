// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const schoolTypeDefs = gql`
  type School {
    # Document id
    _id: ID!

    # Brand name
    brand_name: String!

    # Full legal name
    long_name: String!

    # Address
    address: String

    # Students associated with this school
    students: [Student]

    # School status
    status: Status!

    # Soft-delete timestamp
    deleted_at: String

    # User who deleted this school
    deleted_by: ID!
  }

  input CreateSchoolInput {
    # Brand name for create school input
    brand_name: String!

    # Full legal name for create school input
    long_name: String!

    # Address for create school input
    address: String
  }

  input UpdateSchoolInput {
    # School document id to specify the school
    _id: ID!

    # Brand name for update school input
    brand_name: String

    # Full legal name for update school input
    long_name: String

    # Address for update school input
    address: String
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
