// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 *
 * @param {Object} inputObject - The input containing subject data
 * @param {String} inputObject.name - The name of subject data
 * @param {String} inputObject.description - The description of subject data
 * @param {Number} inputObject.coefficient - The coefficient for calculation factor (not yet implemented)
 */
function ValidateSubjectInput(inputObject) {
  // *************** destructured input object
  const { name, description, coefficient } = inputObject;

  // *************** validate subject's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate subject's coefficient
  if (!coefficient || typeof coefficient !== 'number') throw new ApolloError('name is required and must be a number');
  if (coefficient < 0 || coefficient === 0) throw new ApolloError('coefficient must be a positive number and cannot be 0');

  // *************** validate subject's coefficient
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

module.exports = { ValidateSubjectInput };
