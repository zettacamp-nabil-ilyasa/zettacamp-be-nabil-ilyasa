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
  // *************** validate limit for pagination
  if (paginationObjectInput?.limit) {
    if (typeof paginationObjectInput.limit !== 'number' || isNaN(paginationObjectInput.limit)) {
      throw new ApolloError('limit must be a number');
    }
    if (paginationObjectInput.limit <= 0 || paginationObjectInput.limit > 100) {
      throw new ApolloError('limit must greater than 0 and less than 100');
    }
  }

  // *************** validate offset for pagination
  if (paginationObjectInput?.page) {
    if (typeof paginationObjectInput.page !== 'number' || isNaN(paginationObjectInput.page)) {
      throw new ApolloError('page must be a number');
    }
    if (paginationObjectInput.page < 0) {
      throw new ApolloError('page cannot be a negative number');
    }
  }
}

module.exports = { ValidatePaginationInput };
