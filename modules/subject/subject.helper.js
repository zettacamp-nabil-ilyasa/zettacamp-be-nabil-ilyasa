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
function SubjectPayloadComposer(inputObject) {
  // *************** sanity check
  if (!inputObject.name) {
    throw new ApolloError('name is required for payload');
  }
  if (!inputObject.coefficient) {
    throw new ApolloError('coefficient is required for payload');
  }
  if (!inputObject.block_id) {
    throw new ApolloError('block_id is required for payload');
  }

  // *************** return composed payload
  const subjectPayload = {
    name: inputObject.name,
    description: inputObject.description,
    block_id: inputObject.block_id,
    coefficient: inputObject.coefficient,
  };

  return subjectPayload;
}

// *************** EXPORT MODULE ***************
module.exports = { SubjectPayloadComposer };
