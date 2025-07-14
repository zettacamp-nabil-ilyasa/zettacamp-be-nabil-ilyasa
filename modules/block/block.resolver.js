// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const BlockModel = require('./block.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateBlockInput } = require('./block.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** IMPORT HELPER ***************
const { BlockPayloadComposer } = require('./block.helper.js');

// *************** QUERY ****************
/**
 * Get all active blocks from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of block documents with status 'active'.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllBlocks(parent, { pagination }) {
  try {
    // *************** validate limit and offset within paginationInput
    ValidatePaginationInput(pagination);

    // *************** set default limit and offset
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? 20;

    // *************** apply pagination
    const blocks = await BlockModel.find({ status: 'active' }).skip(offset).limit(limit).sort({ createdAt: -1 }).lean();
    return blocks;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllBlocks',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ pagination }),
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
    // **************** validate block's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    const block = await BlockModel.findOne({ _id, status: 'active' }).lean();

    // **************** check if block document found
    if (!block) {
      throw new ApolloError("block doesn't exist or already deleted");
    }
    return block;
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

// **************** MUTATION ****************
/**
 * Create a new block after validating input.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Block input fields.
 * @param {string} input.name - Name of block.
 * @param {string} [input.description] - Description of block.
 * @returns {Promise<Object>} - Created block document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function CreateBlock(parent, { input }) {
  try {
    // *************** validation to ensure bad input is handled correctly
    ValidateBlockInput(input);

    // *************** compose payload
    const newBlock = BlockPayloadComposer(input);

    // *************** create block with composed payload
    const createdBlock = await BlockModel.create(newBlock);
    return createdBlock;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a block document after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the block to update.
 * @param {object} input - BLock input fields.
 * @param {string} input.name - Name of block.
 * @param {string} input.description - Description of block.
 * @returns {Promise<Object>} - Updated block document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function UpdateBlock(parent, { _id, input }) {
  try {
    // *************** validate the block's id
    ValidateMongoObjectId(_id);

    // *************** validation to ensure bad input is handled correctly
    ValidateBlockInput(input);

    // *************** compose payload
    const editedBlock = BlockPayloadComposer(input);

    // *************** update block with composed payload
    const updatedBlock = BlockModel.findOneAndUpdate({ _id }, { $set: editedBlock }, { new: true }).lean();
    return updatedBlock;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a block by marking its status as 'deleted', prevents deletion if block is referenced by any subject.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the block to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, block not found, or block is referenced.
 */
async function DeleteBlock(parent, { _id }) {
  try {
    // *************** validate the block's id
    ValidateMongoObjectId(_id);

    // *************** get the block's document
    const toBeDeletedBlockDocument = await BlockModel.findOne({ _id, status: 'active' }).lean();

    // *************** check if the block document is exist
    if (!toBeDeletedBlockDocument) {
      throw new ApolloError("block doesn't exist or already deleted");
    }

    // *************** check if the block document is referenced by subject
    if (toBeDeletedBlockDocument.subject_ids?.length) {
      throw new ApolloError('block that is referenced by subject cannot be deleted');
    }

    // *************** soft delete the block by updating status and deleted_at
    await BlockModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_at: new Date() } });

    return 'block deleted succesfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the subject_ids field in a block document using DataLoader.
 * @async
 * @param {object} parent - The block object containing test_ids field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.subject - DataLoader instance for subjects.
 * @returns {Promise<Object|null>} - The subject document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function subject_ids(parent, args, context) {
  try {
    // *************** check if subject has any subject_ids
    if (!parent?.subject_ids) {
      return null;
    }

    // *************** load subject
    const loadedSubjects = await context.loaders.subject.loadMany(parent.subject_ids);
    return loadedSubjects;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'subject_ids',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllBlocks, GetOneBlock },
  Mutation: { CreateBlock, UpdateBlock, DeleteBlock },
  Block: {
    subject_ids,
  },
};
