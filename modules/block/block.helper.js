// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Compose payload for block mutation
 * @param {String} blockName - The name of Block
 * @param {String} blockDescription - The description of Block
 * @returns {Object} - The composed payload for Block mutation
 */
function BlockPayloadComposer({ blockName, blockDescription }) {
  // *************** sanity check
  if (!blockName) {
    throw new ApolloError('name is required for payload');
  }
  // *************** return composed payload
  const blockPayload = { name: blockName, description: blockDescription };
  return blockPayload;
}

/**
 * Compose array of payload object from pass conditions input
 * @param {Array<Object>} passConditionsInput - an array of object containing pass/fail criteria
 * @param {String} parameter - pass condition's parameter to be used for conditional checking
 * @param {Number} parameter_value - pass condition's parameter_value to be used as comparator
 * @param {String} syllabus_type - pass condition's syllabus_type
 * @param {String} subject_id - id of Subject used within pass_conditions
 * @param {String} test_id - id of Test used within pass_conditions
 *@param  {String} math_operator - string representation of math_operator
 * @param {String} logical_operator - string representation of logical operator
 * @throws {ApolloError} - if sanity check fails
 */
function BlockPassConditionsPayloadComposer(passConditionsInput) {
  let passConditionsPayload = [];
  passConditionsInput.forEach((passCondition, index) => {
    // *************** sanity check for parameter
    if (!passCondition.parameter) throw new ApolloError(`pass condition's parameter in ${index} is required`);

    // *************** sanity check for parameter_value
    if (!passCondition.parameter_value) throw new ApolloError(`pass condition's parameter_value in ${index}  is required`);

    // *************** sanity check for syllabus_type
    if (!passCondition.syllabus_type) throw new ApolloError(`pass condition's syllabus_type in ${index}  is required`);

    // *************** sanity check for math_operator
    if (!passCondition.math_operator) throw new ApolloError(`pass condition's math_operator in ${index}  is required`);

    let payloadObject = {
      parameter: passCondition.parameter,
      parameter_value: passCondition.parameter_value,
      syllabus_type: passCondition.syllabus_type,
      math_operator: passCondition.math_operator,
    };

    // *************** sanity check for logical_operator of the object with index more than 0
    if (passConditionsInput.length > 1 && index >= 1) {
      if (!passCondition.logical_operator) throw new ApolloError(`logical operator is required in ${index}`);
      payloadObject.logical_operator = passCondition.logical_operator;
    }

    // *************** make sure to include subject_id if syllabus type is 'subject' and parameter is  'average_of'
    if (passCondition.parameter === 'average_of' && passCondition.syllabus_type === 'subject') {
      if (!passCondition.subject_id) throw new ApolloError(`pass condition's subject_id in ${index} is required`);
      payloadObject.subject_id = passCondition.subject_id;
    }

    // *************** make sure to include test_id if syllabus type is 'test' and parameter is 'mark'
    if (passCondition.parameter === 'mark' && passCondition.syllabus_type === 'test') {
      if (!passCondition.test_id) throw new ApolloError(`pass condition's test_id in ${index} is required`);
      payloadObject.test_id = passCondition.test_id;
    }

    // *************** insert payload into array
    passConditionsPayload.push(payloadObject);
  });

  return passConditionsPayload;
}

// *************** EXPORT MODULE ***************
module.exports = { BlockPayloadComposer, BlockPassConditionsPayloadComposer };
