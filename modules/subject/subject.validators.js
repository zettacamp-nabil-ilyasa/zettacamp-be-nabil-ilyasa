// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validate subject input
 * @param {Object} inputObject - The input containing subject data
 * @param {String} inputObject.block_id - The block id associated with subject
 * @param {String} inputObject.name - The name of subject data
 * @param {String} inputObject.description - The description of subject data
 * @param {Number} inputObject.coefficient - The coefficient for calculation factor (not yet implemented)
 */
function ValidateSubjectInputForCreate(inputObject) {
  // *************** destructured input object
  const { name, description, coefficient, block_id } = inputObject;

  // *************** validate block_id
  ValidateMongoObjectId(block_id);

  // *************** validate subject's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate subject's coefficient
  if (typeof coefficient !== 'number') throw new ApolloError('coefficient is required and must be a number');
  if (coefficient < 0 || coefficient === 0) throw new ApolloError('coefficient must be a positive number and cannot be 0');

  // *************** validate subject's coefficient
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

/**
 * Validate subject input
 * @param {Object} inputObject - The input containing subject data
 * @param {String} inputObject.name - The name of subject data
 * @param {String} inputObject.description - The description of subject data
 * @param {Number} inputObject.coefficient - The coefficient for calculation factor (not yet implemented)
 */

function ValidateSubjectInputForUpdate(inputObject) {
  // *************** destructured input object
  const { name, description, coefficient } = inputObject;

  // *************** validate subject's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate subject's coefficient
  if (typeof coefficient !== 'number') throw new ApolloError('coefficient is required and must be a number');
  if (coefficient < 0 || coefficient === 0) throw new ApolloError('coefficient must be a positive number and cannot be 0');

  // *************** validate subject's coefficient
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateSubjectInputForCreate, ValidateSubjectInputForUpdate };
