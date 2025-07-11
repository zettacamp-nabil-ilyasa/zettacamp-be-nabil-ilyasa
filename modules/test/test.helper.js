// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model.js');
const TaskModel = require('..task/task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

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
    const subjectObjectId = new Mongoose.Types.ObjectId(subjectId);

    // *************** build aggregation query to get the weight of all tests referenced the same subject_id
    const aggQuery = [{ $match: { subject_id: subjectObjectId } }, { $group: { _id: null, total_weight: { $sum: '$weight' } } }];

    // *************** execute the query
    const summedWeight = await TestModel.aggregate(aggQuery);
    const totalWeight = summedWeight[0]?.total_weight;
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
  if (checkSubjectId) ValidateMongoObjectId(inputObject.subject_id);

  // *************** sanity check for mandatory fields
  if (!inputObject.name) throw new ApolloError('name is required for payload');
  if (!inputObject.weight) throw new ApolloError('weight is required for payload');
  const subjectPayload = {
    name: inputObject.name,
    weight: inputObject.weight,
    description: inputObject.description,
    notations: inputObject.notations,
  };

  // *************** validate subject_id if checkSubjectId set to true
  if (checkSubjectId) {
    ValidateMongoObjectId(inputObject.subject_id);
    subjectPayload.subject_id = inputObject.subject_id;
  }
  return subjectPayload;
}

/**
 * Create task for assign corrector
 * @param {string} userId - Id of user
 */
async function CreateAssignCorrectorTask({ userId, testId }) {
  try {
    // *************** validate user_id
    ValidateMongoObjectId(userId);

    // *************** create task for assign corrector
    const newAssignCorrectorTask = { user_id: userId, test_id: testId, type: 'assign_corrector', status: 'in_progress' };
    await TaskModel.create(newAssignCorrectorTask);
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateAssignCorrectorTask',
      path: '/modules/test/test.helper.js',
      parameter_input: JSON.stringify({ userId, testId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { GetTotalWeightOfTests, TestPayloadComposer, CreateAssignCorrectorTask };
