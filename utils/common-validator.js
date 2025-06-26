// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

/**
 * Validate that the given ID is a non-empty valid MongoDB ObjectId.
 * @param {string} id - The ID to validate.
 * @throws {ApolloError} - Throws an error if the ID is missing or not a valid ObjectId format.
 */
function ValidateId(id) {
  if (!id) {
    throw new ApolloError('ID is required');
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApolloError('Invalid ID format');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateId,
};
