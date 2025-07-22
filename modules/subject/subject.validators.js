// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validate subject input
 * @param {Object} inputObject - The input containing subject data
 * @param {String} inputObject.block_id - The block id associated with subject
 * @param {String} inputObject.name - The name of subject data
 * @param {String} inputObject.description - The description of subject data
 * @param {Number} inputObject.coefficient - The coefficient for calculation factor (not yet implemented)
 */
function ValidateSubjectInput(inputObject) {
  // *************** destructured input object
  const { name, description, coefficient, block_id } = inputObject;

  // *************** validate block_id
  ValidateMongoObjectId(block_id);

  // *************** validate subject's name
  if (!name || typeof name !== 'string') throw new ApolloError('name is required and must be a string');

  // *************** validate subject's coefficient
  if (typeof coefficient !== 'number') throw new ApolloError('coefficient is required and must be a number');
  if (coefficient < 0 || coefficient === 0) throw new ApolloError('coefficient must be a positive number and cannot be 0');

  // *************** validate subject's coefficient
  if (description && typeof description !== 'string') throw new ApolloError('description must be a string');
}

/**
 * Validate subject filter input
 * @param {Object} filterInput - The input containing filter
 * @param {String} filterInput.block_id - The block id used as filter
 */
function ValidateSubjectFilterInput(filterInput) {
  if (filterInput?.block_id) ValidateMongoObjectId(filterInput.block_id);
}

/**
 * Validate pass conditions input
 * @param {Array<Object>} subjectPassConditionsInput - an array of object containing pass/fail criteria
 * @param {String} parameter - pass condition's parameter to be used for conditional checking
 * @param {Number} parameter_value - pass condition's parameter_value to be used as comparator
 * @param {String} syllabus_type - pass condition's syllabus_type
 * @param {String} test_id - id of Test used within pass_conditions
 *@param  {String} math_operator - string representation of math_operator
 * @param {String} logical_operator - string representation of logical operator
 * @throws {ApolloError} - if validation fails
 */
function ValidateSubjectPassConditionsInput(subjectPassConditionsInput) {
  if (!Array.isArray(subjectPassConditionsInput)) {
    throw new ApolloError('input must be an array');
  }
  subjectPassConditionsInput.forEach((passCondition, index) => {
    // *************** validate pass condition's parameter, check if it's value is allowed
    if (!passCondition.parameter || typeof passCondition.parameter !== 'string') {
      throw new ApolloError(`pass condition's parameter in index[${index}] must be a string`);
    }

    // *************** validate pass condition's parameter_value
    if (!passCondition.parameter_value || typeof passCondition.parameter_value !== 'number') {
      throw new ApolloError(`pass condition's parameter_value in index[${index}] must be a number`);
    }

    // *************** validate pass condition's syllabus_type
    if (!passCondition.syllabus_type || typeof passCondition.syllabus_type !== 'string') {
      throw new ApolloError(`pass condition's syllabus_type in index[${index}] must be a string`);
    }

    // *************** validate pass condition's math_operator
    if (!passCondition.math_operator || typeof passCondition.math_operator !== 'string') {
      throw new ApolloError(`pass condition's math_operator in index[${index}] must be a string`);
    }

    // *************** validate rules for parameter 'mark'
    if (passCondition.parameter === 'mark') {
      // *************** validate test_id if syllabus_type is 'test'
      if (passCondition.syllabus_type === 'test') {
        ValidateMongoObjectId(passCondition.test_id);
      } else {
        throw new ApolloError(`pass condition's 'mark' cannot be used for syllabus_type other than 'test' in index[${index}]`);
      }
    }

    // *************** validate rules for pass condition's parameter 'average_of'
    if (passCondition.parameter === 'average_of_single' && passCondition.syllabus_type !== 'subject') {
      throw new ApolloError(
        `pass condition's 'average_of_single' cannot be used for syllabus_type other than 'subject' in index[${index}]`
      );
    }

    // *************** validate logical operator if subjectPassConditionsInput have more than one element
    if (subjectPassConditionsInput.length > 1 && index >= 1) {
      if (!passCondition.logical_operator || typeof passCondition.logical_operator !== 'string') {
        throw new ApolloError(`logical operator in index[${index}] is required for multiple pass condition`);
      }
    }
  });
}
// *************** EXPORT MODULE ***************
module.exports = { ValidateSubjectInput, ValidateSubjectFilterInput, ValidateSubjectPassConditionsInput };
