// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Compose payload for block mutation
 * @param {String} blockName - The name of Block
 * @param {String} blockDescription - The description of Block
 * @returns {Object} - The composed payload for Block mutation
 */
function BlockPayloadComposer({ blockName, blockDescription }) {
  // *************** sanity check
  if (!blockName) {
    throw new ApolloError('name is required for payload');
  }
  // *************** return composed payload
  return { name: blockName, description: blockDescription };
}

// *************** EXPORT MODULE ***************
module.exports = { BlockPayloadComposer };
