// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const BlockModel = require('./block.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { allowedRoles } = require('../../shared/strings.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** IMPORT HELPER ***************
const { BlockPayloadComposerForCreate, BlockPayloadComposerForUpdate, BlockPassConditionsPayloadComposer } = require('./block.helper.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateBlockInput, ValidateBlockPassConditionsInput } = require('./block.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** QUERY ****************
/**
 * Get all active blocks from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of block documents with status 'active'.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllBlocks(parent, { paginationInput }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Block.GetAllBlocks });

    // *************** validate limit and offset within paginationInput
    ValidatePaginationInput(paginationInput);

    // *************** set default limit and page
    const page = paginationInput?.page ?? 1;
    const limit = paginationInput?.limit ?? 10;
    const skip = (page - 1) * limit;

    // *************** apply pagination
    const blocks = await BlockModel.find({ status: 'active' }).skip(skip).limit(limit).sort({ createdAt: -1 }).lean();
    return blocks;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllBlocks',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ paginationInput }),
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
async function GetOneBlock(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate block's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    const block = await BlockModel.findOne({ _id, status: 'active' }).lean();

    // *************** check if block document found
    if (!block) {
      throw new ApolloError("block doesn't exist or already deleted");
    }
    return block;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** MUTATION ****************
/**
 * Create a new block after validating input.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} blockName - Name of block.
 * @param {string} [blockDescription] - Description of block.
 * @returns {Promise<Object>} - Created block document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function CreateBlock(parent, { name, description }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Block.CreateBlock });

    // *************** validation to ensure bad input is handled correctly
    ValidateBlockInput({ blockName: name, blockDescription: description });

    // *************** compose payload
    const newBlock = BlockPayloadComposerForCreate({ blockName: name, blockDescription: description, createdBy: context.user._id });

    // *************** create block with composed payload
    const createdBlock = await BlockModel.create(newBlock);
    return createdBlock;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ name, description }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a block document after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the block to update.
 * @param {string} blockName - Name of block.
 * @param {string} blockDescription - Description of block.
 * @returns {Promise<Object>} - Updated block document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function UpdateBlock(parent, { _id, name, description }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Block.UpdateBlock });

    // *************** validate the block's id
    ValidateMongoObjectId(_id);

    // *************** validation to ensure bad input is handled correctly
    ValidateBlockInput({ blockName: name, blockDescription: description });

    // *************** compose payload
    const editedBlock = BlockPayloadComposerForUpdate({ blockName: name, blockDescription: description, updatedBy: context.user._id });

    // *************** update block with composed payload
    const updatedBlock = await BlockModel.findOneAndUpdate({ _id }, { $set: editedBlock }, { new: true }).lean();
    return updatedBlock;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateBlock',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({ _id, name, description }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Add pass_conditions field into a specific block
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {String} _id - _id of the block
 * @param {Array<Object>} blockPassConditionsInput - an array of object containing pass/fail criteria
 * @param {String} parameter - pass condition's parameter to be used for conditional checking
 * @param {Number}parameter_value - pass condition's parameter_value to be used as comparator
 * @param {String}syllabus_type - pass condition's syllabus_type
 * @param {String}subject_id - id of Subject used within pass_conditions
 * @param {String}test_id - id of Test used within pass_conditions
 *@param  {String}math_operator - string representation of math_operator
 * @param {String}logical_operator - string representation of logical operator
 */
async function AddBlockPassConditions(parent, { _id, input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Block.AddBlockPassConditions });

    // *************** validate block's id
    ValidateMongoObjectId(_id);

    // *************** validate block's pass_conditions input
    ValidateBlockPassConditionsInput(input);

    // *************** compose payload
    const blockPassConditionsPayload = BlockPassConditionsPayloadComposer(input);
    const addedPassConditions = await BlockModel.findOneAndUpdate(
      { _id },
      { pass_conditions: blockPassConditionsPayload, updated_by: context.user._id },
      { new: true }
    );
    return addedPassConditions;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'AddBlockPassConditions',
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
async function DeleteBlock(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Block.DeleteBlock });

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
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the subject_id field in pass_conditions field in block document using DataLoader.
 * @async
 * @param {object} parent - The passcondition object containing subject_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.subject - DataLoader instance for subjects.
 * @returns {Promise<Object|null>} - The subject document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function subject_id(parent, args, context) {
  try {
    if (!parent?.subject_id) return null;
    return await context.loaders.subject.load(parent.subject_id);
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'subject_id',
      path: '/modules/block/passCondition.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the test_id field in pass_conditions field in block document using DataLoader.
 * @async
 * @param {object} parent - The passcondition object containing test_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.test - DataLoader instance for tests.
 * @returns {Promise<Object|null>} - The test document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function test_id(parent, args, context) {
  try {
    if (!parent?.test_id) return null;
    return await context.loaders.test.load(parent.test_id);
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'test_id',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a user object using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - Parent user object.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context that contains DataLoaders.
 * @returns {Promise<Object|null>} - The User document or null if not available.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function created_by(parent, args, context) {
  try {
    // *************** check if user has any created_by
    if (!parent?.created_by) {
      return null;
    }

    // *************** load user
    const loadedUser = await context.loaders.user.load(parent.created_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'created_by',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the updated_by field in a user object using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - Parent user object.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context that contains DataLoaders.
 * @returns {Promise<Object|null>} - The User document or null if not available.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function updated_by(parent, args, context) {
  try {
    // *************** check if user has any created_by
    if (!parent?.updated_by) {
      return null;
    }

    // *************** load user
    const loadedUser = await context.loaders.user.load(parent.updated_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'created_by',
      path: '/modules/block/block.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllBlocks, GetOneBlock },
  Mutation: { CreateBlock, UpdateBlock, AddBlockPassConditions, DeleteBlock },
  Block: {
    subject_ids,
    created_by,
    updated_by,
  },
  BlockPassCondition: {
    subject_id,
    test_id,
  },
};
