// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT VALIDATOR ***********************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validate subject input
 * @param {Object} inputObject - The input containing test data
 * @param {String} inputObject.name - The name of test data
 * @param {String} [inputObject.description] - The description of test data
 * @param {Number} inputObject.weight - The weight or proportion value of the test
 * @param {Array<Object>} inputObject.notations - Array of notation object containing notation_text and max_point
 * @param {Object} [option] - Optional parameter to control validation flow
 * @param {Object} [option.update] - Parameter to exclude subject_id from validation (for update mutation)
 */
function ValidateTestInput(inputObject, { update } = {}) {
  // *************** destructured input object
  const { name, description, weight, notations, subject_id } = inputObject;

  // *************** validate subject_id if checkSubjectId set to true
  if (update) {
    ValidateMongoObjectId(subject_id);
  }

  // *************** validate test's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate test's weight
  if (!weight || typeof weight !== 'number') throw new ApolloError('weight is required and must be a number');
  if (weight < 0 || weight > 1) throw new ApolloError('weight must be a positive number and cannot be greater than 1');

  // *************** validate notation if exist
  if (notations.length) {
    notations.forEach((notation) => {
      // *************** validate notation_text if it exist
      if (notation.notation_text && typeof notation.notation_text !== string) {
        throw new ApolloError('notation_text must be a string');
      }
      // *************** validate max_point
      if (!notation.max_point || typeof notation.max_point !== 'number') {
        throw new ApolloError('max_point is required and must be a number');
      }
      if (notation.max_point <= 0 || notation.max_point > 20) {
        throw new ApolloError('max point must be a number within range 1 to 20');
      }
    });
  }

  // *************** validate description if it exist
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

/**
 *
 * @param {Object} filterInput - Input containing filter data for test
 * @param {String} filterInput._id - Id of test
 * @param {String} filterInput.status - Status of test
 */
function ValidateTestFilterInput(filterInput) {
  if (filterInput.subject_id) {
    ValidateMongoObjectId(subject_id);
  }

  const testStatus = ['not_published', 'published'];

  if (filterInput.status && typeof filterInput.status !== 'string') {
    throw new ApolloError('status must be a string');
  }
  if (!testStatus.includes(filterInput.status)) {
    throw new ApolloError(`status must be on of following: ${testStatus.join(', ')}`);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateTestInput, ValidateTestFilterInput };
