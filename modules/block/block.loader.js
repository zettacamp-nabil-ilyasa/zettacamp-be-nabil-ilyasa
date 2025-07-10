// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const BlockModel = require('./block.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Batch function to load multiple blocks by their IDs.
 * @async
 * @param {Array<string>} blockIds - Array of block IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of block objects aligned with input IDs.
 * @throws {ApolloError} - If database query or processing fails.
 */
async function BatchBlocks(blockIds) {
  try {
    // **************** validate each block id
    blockIds.forEach((blockId) => {
      ValidateMongoObjectId(blockId);
    });

    // **************** get all active blocks with id within blockIds and status is active
    const blocks = await BlockModel.find({ _id: { $in: blockIds }, status: 'active' }).lean();

    // **************** set blocks data to dataMap
    const dataMap = new Map();
    blocks.forEach((block) => {
      dataMap.set(String(block._id), block);
    });

    // **************** return array of block objects with order of blockIds
    return blockIds.map((blockId) => dataMap.get(String(blockId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchBlocks',
      path: '/modules/block/block.loader.js',
      parameter_input: JSON.stringify({ blockIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching blocks by block IDs
 * @returns {DataLoader<string, Object>} - A DataLoader instance that loads blocks by block ID
 */
function BlockLoader() {
  return new DataLoader(BatchBlocks);
}

// *************** EXPORT MODULE ***************
module.exports = {
  BlockLoader,
};
