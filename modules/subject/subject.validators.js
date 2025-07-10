// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT VALIDATOR ***********************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validate subject input
 * @param {Object} inputObject - The input containing subject data
 * @param {String} inputObject.name - The name of subject data
 * @param {String} inputObject.description - The description of subject data
 * @param {Number} inputObject.coefficient - The coefficient for calculation factor (not yet implemented)
 * @param {Object} [option] - Optional control flag to exclude block_id from checking (for update mutation)
 * @param {Object} [option.checkBlockId] - Parameter to control validation flow
 */
function ValidateSubjectInput(inputObject, { checkBlockId } = {}) {
  // *************** destructured input object
  const { name, description, coefficient, block_id } = inputObject;

  // *************** validate block_id if checkBlockId set to true
  if (checkBlockId) {
    ValidateMongoObjectId(block_id);
  }

  // *************** validate subject's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate subject's coefficient
  if (!coefficient || typeof coefficient !== 'number') throw new ApolloError('name is required and must be a number');
  if (coefficient < 0 || coefficient === 0) throw new ApolloError('coefficient must be a positive number and cannot be 0');

  // *************** validate subject's coefficient
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

async function ValidateBlockExistence(blockId) {}

module.exports = { ValidateSubjectInput };
