// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator');
const { mathOperatorEnum, logicalOperatorEnum, parameterEnum, blockSyllabusType } = require('../../shared/strings');

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
 * Validate pass conditions input
 * @param {Array<Object>} blockPassConditionsInput - an array of object containing pass/fail criteria
 * @param {String} parameter - pass condition's parameter to be used for conditional checking
 * @param {Number}parameter_value - pass condition's parameter_value to be used as comparator
 * @param {String}syllabus_type - pass condition's syllabus_type
 * @param {String}subject_id - id of Subject used within pass_conditions
 * @param {String}test_id - id of Test used within pass_conditions
 *@param  {String}math_operator - string representation of math_operator
 * @param {String}logical_operator - string representation of logical operator
 * @throws {ApolloError} - if validation fails
 */
function ValidateBlockPassConditionsInput(blockPassConditionsInput) {
  if (!Array.isArray(blockPassConditionsInput)) {
    throw new ApolloError('input must be an array');
  }
  blockPassConditionsInput.forEach((passCondition, index) => {
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

    // *************** validate rules for pass condition's parameter 'average_of_single'
    if (passCondition.parameter === 'average_of_single') {
      // *************** ensure that parameter 'average_of_single' only available for block and subject
      if (passCondition.syllabus_type === 'subject') {
        ValidateMongoObjectId(passCondition.subject_id);
      } else if (passCondition.syllabus_type !== 'subject' && passCondition.syllabus_type !== 'block') {
        throw new ApolloError(
          `pass condition's 'average_of_single' cannot be used for syllabus_type other than 'block' and 'subject' in index[${index}]`
        );
      }

      // *************** validate rules for pass condition's parameter 'average_of_single'
      if (passCondition.parameter === 'average_of_all') {
        if (passCondition.syllabus_type !== 'subject' && passCondition.syllabus_type !== 'test') {
          throw new ApolloError(
            `pass condition's 'average_of_all' cannot be used for syllabus_type other than 'subject' and 'test' in index[${index}]`
          );
        }
      }

      // *************** throw error if syllabus_type is test
      if (passCondition.syllabus_type === 'test') {
        throw new ApolloError(`pass condition's 'mark' cannot be used for syllabus_type 'test' in index[${index}]`);
      }
    }
    // *************** validate logical operator if blockPassConditionsInput have more than one element
    if (blockPassConditionsInput.length > 1 && index >= 1) {
      if (!passCondition.logical_operator || typeof passCondition.logical_operator !== 'string') {
        throw new ApolloError('logical operator in index[${index}] is required for multiple pass condition');
      }
    }
  });
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateBlockInput, ValidateBlockPassConditionsInput };
