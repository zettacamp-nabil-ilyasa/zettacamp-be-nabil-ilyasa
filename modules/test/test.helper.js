// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Get total weight of all tests that referenced the same subject_id
 * @param {string} subjectId - Id of subject referenced by test
 * @returns {number} - Sum of tests weight
 */
async function GetTotalWeightOfTests(subjectId) {
  try {
    // *************** validate subject_id
    ValidateMongoObjectId(subjectId);

    // *************** cast subject_id to ObjectId
    const subjectObjectId = Mongoose.Types.ObjectId(subjectId);

    // *************** build aggregation query to get the weight of all tests referenced the same subject_id
    const aggQuery = [{ $match: { subject_id: subjectObjectId } }, { $group: { $id: null, total_weight: { $sum: '$weight' } } }];

    // *************** execute the query
    const totalWeight = await TestModel.aggregate(aggQuery);
    return totalWeight;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetTotalWeightOfTests',
      path: '/modules/test/test.helper.js',
      parameter_input: JSON.stringify({ subjectId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {Object} inputObject - Input for block mutation
 * @param {String} inputObject.name - Name of test
 * @param {Number} inputObject.weight - weight of test
 * @param {String} inputObject.description - description of test
 * @param {Array<Object>} inputObject.notations - notations object, containing notation_text and max_point
 * @param {String} inputObject.subject_id - Id of subject that referenced by test
 * @returns
 */
function TestPayloadComposer(inputObject, { checkSubjectId } = {}) {
  // *************** validate subject_id if checkSubjectId set to true
  if (checkSubjectId) ValidateMongoObjectId(input.subject_id);

  // *************** sanity check for mandatory fields
  if (!inputObject.name) throw new ApolloError('name is required for payload');
  if (!inputObject.weight) throw new ApolloError('weight is required for payload');
  return { name: inputObject.name, weight: inputObject.weight, description: inputObject.description, notations: inputObject.notations };
}

// *************** EXPORT MODULE ***************
module.exports = { GetTotalWeightOfTests, TestPayloadComposer };
