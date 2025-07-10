// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Validate pagination input (limit & offset)
 * @param {Object} input - The pagination input object
 * @param {number} [input.limit] - The number of items per page
 * @param {number} [input.offset] - The number of items to skip
 * @throws {ApolloError} If validation fails
 */
function ValidatePaginationInput(paginationObjectInput = {}) {
  const { limit, offset } = paginationObjectInput;

  if (limit) {
    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new ApolloError('limit must be a number');
    }
    if (limit <= 0 || limit > 100) {
      throw new ApolloError('limit must greater than 0 and less than 100');
    }
  }

  if (offset) {
    if (typeof offset !== 'number' || isNaN(offset)) {
      throw new ApolloError('offset must be a number');
    }
    if (offset < 0) {
      throw new ApolloError('offset cannot be a negative number');
    }
  }
}

module.exports = { ValidatePaginationInput };
