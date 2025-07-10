// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const BlockModel = require('./block.model.js');

/**
 *
 * @param {Object} input - The input containing block data
 * @param {String} input.name - The name of block data
 * @param {String} input.description - The description of block data
 */
function ValidateBlockInput(input) {
  // *************** destructured input object
  const { name, description } = input;

  // *************** validate name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

module.exports = { ValidateBlockInput };
