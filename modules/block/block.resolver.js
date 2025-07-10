// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const BlockModel = require('./block.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateBlockInput } = require('./block.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// *************** IMPORT HELPER ***********************
const { BlockPayloadComposer } = require('./block.helper.js');

// **************** QUERY ****************
/**
 * Get all active blocks from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of block documents with status 'active'.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllBlocks() {
  try {
    const blocks = await BlockModel.find({ status: 'active' }).lean();
    return blocks;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllBlocks',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active block by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the block to retrieve.
 * @returns {Promise<Object|null>} - Block document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneBlock({ _id }) {
  try {
    // **************** validate school's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    const block = await BlockModel.find({ _id, status: 'active' }).lean();

    // **************** check if school document found
    if (!block) {
      throw new ApolloError("block doesn't exist or already deleted");
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

async function CreateBlock({ input }) {
  // *************** validation to ensure bad input is handled correctly
  ValidateBlockInput(input);

  // *************** compose payload
  const newBlock = BlockPayloadComposer(input);
  // *************** create school with composed payload
  const createdBlock = BlockModel.create(newBlock);
  return createdBlock;
}
