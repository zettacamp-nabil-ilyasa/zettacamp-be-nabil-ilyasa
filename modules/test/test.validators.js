// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const { testStatus, mathOperatorEnum } = require('../../shared/strings');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validate subject input
 * @param {Object} inputObject - The input containing test data
 * @param {String} inputObject.subject_id - The subject id
 * @param {String} inputObject.name - The name of test data
 * @param {String} [inputObject.description] - The description of test data
 * @param {Number} inputObject.weight - The weight or proportion value of the test
 * @param {Array<Object>} inputObject.notations - Array of notation object containing notation_text and max_point
 */
function ValidateTestInput(inputObject) {
  // *************** destructured input object
  const { name, description, weight, notations, subject_id } = inputObject;

  // *************** validate subject_id
  ValidateMongoObjectId(subject_id);

  // *************** validate test's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate test's weight
  if (!weight || typeof weight !== 'number') throw new ApolloError('weight is required and must be a number');
  if (weight < 0 || weight > 1) throw new ApolloError('weight must be a positive number and cannot be greater than 1');

  // *************** validate notation
  if (!Array.isArray(notations) || !notations.length) {
    throw new ApolloError('notations is required');
  }
  notations.forEach((notation, index) => {
    // *************** validate notation_text
    if (!notation.notation_text || typeof notation.notation_text !== 'string') {
      throw new ApolloError(`notation[${index}].notation_text is required and must be a string`);
    }
    // *************** validate max_point
    if (!notation.max_points || typeof notation.max_points !== 'number') {
      throw new ApolloError(`notation[${index}].max_points is required and must be a number`);
    }
    if (notation.max_points <= 0 || notation.max_points > 20) {
      throw new ApolloError(`notation[${index}].max_points must be between 1 and 20`);
    }
  });

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
  // *************** validate subject_id if exist
  if (filterInput?.subject_id) {
    ValidateMongoObjectId(filterInput.subject_id);
  }

  // *************** validate status if exist
  if (filterInput?.status) {
    if (typeof filterInput?.status !== 'string') {
      throw new ApolloError('status must be a string');
    }
    if (!testStatus.includes(filterInput?.status)) {
      throw new ApolloError(`status must be one of following: ${testStatus.join(', ')}`);
    }
  }
}
/**
 * Validate test's pass condition input
 * @param {Object} testPassConditionsInput - object containing test's pass condition data
 * @param {Number} testPassConditionsInput.parameter_value - value to be compared to in pass criteria checking
 * @param {Object} testPassConditionsInput.math_operator - string representation of math operator
 */
function ValidateTestPassConditionInput(testPassConditionsInput) {
  // *************** validate parameter_value
  if (!testPassConditionsInput.parameter_value || typeof testPassConditionsInput.parameter_value !== 'number') {
    throw new ApolloError("pass condition's parameter_value is required and must be a number");
  }

  // *************** validate math_operator, ensure it is one of allowed enum
  if (!testPassConditionsInput.math_operator || typeof testPassConditionsInput.math_operator !== 'string') {
    throw new ApolloError("pass condition's parameter_value is required and must be a string");
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateTestInput, ValidateTestFilterInput, ValidateTestPassConditionInput };
