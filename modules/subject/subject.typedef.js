// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const subjectTypeDefs = gql`
  type Subject {
    _id: ID!
    block_id: Block!
    name: String!
    description: String
    coefficient: Float!
    test_ids: [Test!]
    status: Status!
    created_at: Date!
    created_by: User!
    updated_at: Date!
    deleted_at: Date
    deleted_by: User
  }

  input SubjectInputForCreate {
    name: String!
    description: String
    coefficient: Float!
    block_id: String
  }

  input SubjectInputForUpdate {
    name: String!
    description: String
    coefficient: Float!
  }

  input SubjectFilterInput {
    block_id: String
  }

  extend type Query {
    GetAllSubjects(filter: SubjectFilterInput, pagination: PaginationInput): [Subject]
    GetOneSubject(_id: ID!): Subject
  }

  extend type Mutation {
    CreateSubject(input: SubjectInputForCreate): Subject
    UpdateSubject(_id: ID!, input: SubjectInputForUpdate): Subject
    DeleteSubject(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = subjectTypeDefs;
