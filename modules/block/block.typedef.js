// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const blockTypeDefs = gql`
  type Block {
    _id: ID!
    name: String!
    description: String
    pass_conditions: [BlockPassCondition]
    subject_ids: [Subject]
    status: SyllabusStatus!
    created_at: Date!
    updated_at: Date!
  }

  type BlockPassCondition {
    parameter: ParameterEnum
    parameter_value: Number
    syllabus_type: BlockSyllabusTypeEnum
    subject_id: Subject
    test_id: Test
    math_operator: MathOperatorEnum
    logical_operator: LogicalOperatorEnum
  }

  input BlockPassConditionInput {
    parameter: ParameterEnum
    parameter_value: Number
    syllabus_type: BlockSyllabusTypeEnum
    subject_id: String
    test_id: String
    math_operator: MathOperatorEnum
    logical_operator: LogicalOperatorEnum
  }

  input BlockInput {
    name: String!
    description: String
  }

  input AddBlockPassConditionInput {
    pass_conditions: [AddBlockPassConditionInput]
  }

  enum BlockSyllabusTypeEnum {
    block
    subject
    test
  }

  extend type Query {
    GetAllBlocks(pagination: PaginationInput): [Block]
    GetOneBlock(_id: ID!): Block
  }

  extend type Mutation {
    CreateBlock(name: String!, description: String): Block
    UpdateBlock(_id: ID!, name: String!, description: String): Block
    AddBlockPassConditions(_id: ID!, input: AddBlockPassConditionInput): Block
    DeleteBlock(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = blockTypeDefs;
