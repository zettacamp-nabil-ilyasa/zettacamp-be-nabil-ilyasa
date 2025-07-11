// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT VALIDATOR ***********************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 *
 * @param {Object} inputObject - Object containing filter data
 * @param {Object} inputObject.type - Type of task
 * @param {Object} inputObject.status - Status of task
 */
function ValidateTaskFilterInput(inputObject) {
  if (inputObject.type) {
    if (typeof inputObject.type !== string) {
      throw new ApolloError('type must be a string');
    }
    const types = ['assign_corrector', 'validate_marks', 'enter_marks'];
    if (!types.includes(inputObject.type)) {
      throw new ApolloError(`type should be one of following: $types.join(', )`);
    }
  }

  if (inputObject.status) {
    if (typeof inputObject.status !== string) {
      throw new ApolloError('status must be a string');
    }
    const statuses = ['pending', 'in_progress', 'completed'];
    if (!statuses.includes(inputObject.status)) {
      throw new ApolloError(`status should be one of following: $statuses.join(', )`);
    }
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateTaskFilterInput };
