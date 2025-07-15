// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 *
 * @param {Object} input - The input containing block data
 * @param {String} input.name - The name of block data
 * @param {String} input.description - The description of block data
 */
function ValidateBlockInput({ blockName, blockDescription }) {
  // *************** validate block's name
  if (!blockName || typeof blockName !== 'string') throw new ApolloError('name is required and must be a string');
  if (blockDescription && typeof blockDescription !== 'string') throw new ApolloError('description must be a string');
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateBlockInput };
