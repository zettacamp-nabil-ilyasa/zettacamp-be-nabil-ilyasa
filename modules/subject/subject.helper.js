// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 *
 * @param {Object} inputObject - The input object of subject
 * @param {String} inputObject.name - The name of subject
 * @param {String} inputObject.description - The description of subject
 * @param {Number} inputObject.coefficient - The coefficient of subject
 * @returns {Object} - The composed payload for subject mutation
 */
function SubjectPayloadComposer(inputObject, { addBlockId } = {}) {
  // *************** sanity check
  if (!inputObject.name) {
    throw new ApolloError('name is required for payload');
  }
  if (!inputObject.coefficient) {
    throw new ApolloError('coefficient is required for payload');
  }

  // *************** sanity check block_id if checkBlockId set to true
  if (addBlockId && !inputObject.block_id) {
    throw new ApolloError('block_id is required for payload');
  }

  // *************** return composed payload
  return {
    name: inputObject.name,
    description: inputObject.description,
    block_id: inputObject.block_id,
    coefficient: inputObject.coefficient,
  };
}

// *************** EXPORT MODULE ***************
module.exports = { SubjectPayloadComposer };
