// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator');

/**
 *
 * @param {Object} input - The input containing block data
 * @param {String} input.name - The name of block data
 * @param {String} input.description - The description of block data
 */
function ValidateBlockInput({ blockName, blockDescription }) {
  // *************** validate block's name
  if (!blockName || typeof blockName !== 'string') throw new ApolloError('name is required and must be a string');
  if (blockDescription && typeof blockDescription !== 'string') throw new ApolloError('description must be a string');
}
/**
 *
 * @param {Array<Object>} blockPassConditionsInput - an array of object containing pass/fail criteria
 * @param {String} parameter - pass condition's parameter to be used for conditional checking
 * @param {Number}parameter_value - pass condition's parameter_value to be used as comparator
 * @param {String}syllabus_type - pass condition's syllabus_type
 * @param {String}subject_id - id of Subject used within pass_conditions
 * @param {String}test_id - id of Test used within pass_conditions
 *@param  {String}math_operator - string representation of math_operator
 * @param {String}logical_operator - string representation of logical operator
 *
 */
function ValidateBlockPassConditionsInput(blockPassConditionsInput) {
  if (!Array.isArray(blockPassConditionsInput))
    blockPassConditionsInput.forEach((passCondition, index) => {
      // *************** validate pass condition's parameter
      if (!passCondition.parameter || typeof passCondition.parameter !== 'string') {
        throw new ApolloError(`pass condition's parameter in ${index} must be a string`);
      }

      // *************** validate pass condition's parameter_value
      if (!passCondition.parameter_value || typeof passCondition.parameter_value !== 'number') {
        throw new ApolloError(`pass condition's parameter_value in ${index} must be a number`);
      }

      // *************** validate pass condition's syllabus_type
      if (!passCondition.syllabus_type || typeof passCondition.syllabus_type !== 'string') {
        throw new ApolloError(`pass condition's syllabus_type in ${index} must be a string`);
      }

      // *************** validate pass condition's math_operator
      if (!passCondition.math_operator || typeof passCondition.math_operator !== 'string') {
        throw new ApolloError(`pass condition's math_operator in ${index} must be a string`);
      }

      // *************** apply some rules for parameter 'mark'
      if (passCondition.parameter === 'mark') {
        // *************** validate test_id if syllabus_type is 'test'
        if (passCondition.syllabus_type === 'test') {
          ValidateMongoObjectId(passCondition.test_id);
        }

        // *************** throw error if syllabus_type is subject
        if (passCondition.syllabus_type === 'subject') {
          throw new ApolloError(`pass condition's 'mark' cannot be used for syllabus_type 'subject' in ${index}`);
        }
      }

      // *************** validate pass condition's parameter 'average_of_marks'
      if (passCondition.parameter === 'average_of_marks') {
        // *************** validate subject_id if syllabus_type is 'subject'
        if (passCondition.syllabus_type === 'subject') {
          ValidateMongoObjectId(passCondition.subject_id);
        }

        // *************** throw error if syllabus_type is test
        if (passCondition.syllabus_type === 'test') {
          throw new ApolloError(`pass condition's 'mark' cannot be used for syllabus_type 'test' in ${index}`);
        }
      }
      // *************** validate logical operator if blockPassConditionsInput have more than one element
      if (blockPassConditionsInput.length > 1) {
        if (!blockPassConditionsInput[1].logical_operator) {
          throw new ApolloError('logical operator is required for multiple pass condition');
        }
      }
    });
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateBlockInput, ValidateBlockPassConditionsInput };
