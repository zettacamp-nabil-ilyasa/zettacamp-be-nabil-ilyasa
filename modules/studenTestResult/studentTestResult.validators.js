// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT VALIDATOR ***********************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

function ValidateStudentTestResultInput(inputObject) {}

/**
 *
 * @param {Object} inputObject - Object containing optional filter data
 * @param {String} inputObject.test_id - String with format of ObjectId
 * @param {Object} inputObject.status - String represents status of the StudentTestResult
 */
function ValidateStudentTestResultFilterInput(inputObject) {
  // *************** validate test_id if exist
  if (inputObject.test_id) {
    ValidateMongoObjectId(inputObject.test_id);
  }

  // *************** validate status if exist
  if (inputObject.status || typeof inputObject.status !== 'string') {
    throw new ApolloError('status must be a string');
  }
  const studentTestResultStatus = ['completed', 'need_revision', 'validated'];
  if (!studentTestResultStatus.includes(inputObject.Status.lowercase)) {
    throw new ApolloError(`status must be one of following: ${studentTestResultStatus.join(', ')}`);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateStudentTestResultFilterInput };
