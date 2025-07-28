// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentTestResultModel = require('./student_test_result.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Batch function to load multiple student test results by their IDs.
 * @async
 * @param {Array<string>} studentTestResultIds - Array of student test result IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of student test result objects aligned with input IDs.
 * @throws {ApolloError} - If database query fails.
 */
async function BatchStudentTestResults(studentTestResultIds) {
  try {
    // *************** validate each student id
    studentTestResultIds.forEach((studentResultId) => {
      ValidateMongoObjectId(studentResultId);
    });

    // *************** get all active student test results with id within studentTestResultIds and status is not deleted
    const testResults = await StudentTestResultModel.find({ _id: { $in: studentTestResultIds }, status: { $ne: 'deleted' } }).lean();

    // *************** set student test results data to dataMap
    const dataMap = new Map();
    testResults.forEach((testResult) => {
      dataMap.set(String(testResult._id), testResult);
    });

    // *************** return array of student test results objects with order of studentTestResultIds
    return studentTestResultIds.map((studentTestResultId) => dataMap.get(String(studentTestResultId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchStudentTestResults',
      path: '/modules/studentTestResult/student_test_result.loader.js',
      parameter_input: JSON.stringify({ studentTestResultIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * create a new DataLoader instance for batching student test results by student IDs.
 * @returns {DataLoader<string, Object>s} A DataLoader instance that loads student test results by student ID.
 */
function StudentTestResultLoader() {
  return new DataLoader(BatchStudentTestResults);
}

// *************** EXPORT MODULE ***************
module.exports = {
  StudentTestResultLoader,
};
