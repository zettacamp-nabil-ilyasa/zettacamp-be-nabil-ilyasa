// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Batch function to load multiple tests by their IDs.
 * @async
 * @param {Array<string>} testIds - Array of test IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of test objects aligned with input IDs.
 * @throws {ApolloError} - If database query or processing fails.
 */
async function BatchTests(testIds) {
  try {
    // *************** validate each test id
    testIds.forEach((testId) => {
      ValidateMongoObjectId(testId);
    });

    // *************** get all active test with id within testIds and status is active
    const tests = await TestModel.find({ _id: { $in: testIds }, status: { $ne: 'deleted' } }).lean();

    // *************** set tests data to dataMap
    const dataMap = new Map();
    tests.forEach((test) => {
      dataMap.set(String(test._id), test);
    });

    // *************** return array of test objects with order of testIds
    return testIds.map((testId) => dataMap.get(String(testId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchTests',
      path: '/modules/test/test.loader.js',
      parameter_input: JSON.stringify({ testIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching tests by test IDs
 * @returns {DataLoader<string, Object>} - A DataLoader instance that loads tests by test ID
 */
function TestLoader() {
  return new DataLoader(BatchTests);
}

// *************** EXPORT MODULE ***************
module.exports = {
  TestLoader,
};
