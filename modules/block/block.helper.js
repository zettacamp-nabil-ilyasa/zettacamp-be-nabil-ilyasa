// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Compose payload for block mutation
 * @param {Object} inputObject - The input object of Block
 * @param {String} inputObject.name - The name of Block
 * @param {String} inputObject.description - The description of Block
 * @returns {Object} - The composed payload for Block mutation
 */
function BlockPayloadComposer(inputObject) {
  // *************** sanity check
  if (!inputObject.name) {
    throw new ApolloError('name is required for payload');
  }
  // *************** return composed payload
  return { name: inputObject.name, description: inputObject.description };
}

// *************** EXPORT MODULE ***************
module.exports = { BlockPayloadComposer };
