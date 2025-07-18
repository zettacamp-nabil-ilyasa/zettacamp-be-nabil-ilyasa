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

function BlockPassConditionsPayloadComposer(passConditionsInput) {
  let passConditionPayload = [];
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

    // *************** make sure to include subject_id if syllabus type is 'subject'
    if (passCondition.syllabus_type === 'subject') {
      if (!passCondition.subject_id) throw new ApolloError(`pass condition's subject_id in ${index} is required`);
      payloadObject.subject_id = passCondition.subject_id;

      // *************** make sure to include test_id if syllabus type is 'test'
    } else if (passCondition.syllabus_type === 'test') {
      if (!passCondition.test_id) throw new ApolloError(`pass condition's test_id in ${index} is required`);
      payloadObject.test_id = passCondition.test_id;
    }
  });
}

// *************** EXPORT MODULE ***************
module.exports = { BlockPayloadComposer, BlockPassConditionsPayloadComposer };
