// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TaskModel = require('../task/task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// *************** IMPORT HELPER ***************
const { GetTestNotations } = require('./student_test_result.helper.js');

/**
 * Validate optional filter input for fetching student test results.
 * @param {Object} inputObject - Object containing filter data.
 * @param {string} [inputObject.test_id] - Optional test ID to filter by.
 * @param {string} [inputObject.status] - Optional status to filter by.
 * @throws {ApolloError} - If input is invalid.
 */
function ValidateStudentTestResultFilterInput(inputObject) {
  // *************** validate test_id if exist
  if (inputObject.test_id) {
    ValidateMongoObjectId(inputObject.test_id);
  }

  // *************** validate status if exist
  if (inputObject.status && typeof inputObject.status !== 'string') {
    throw new ApolloError('status must be a string');
  }
  const studentTestResultStatus = ['completed', 'need_revision', 'validated'];
  if (!studentTestResultStatus.includes(inputObject.status)) {
    throw new ApolloError(`status must be one of following: ${studentTestResultStatus.join(', ')}`);
  }
}

/**
 * Validate task ID and fetch the corresponding 'enter_marks' task in progress.
 * @async
 * @param {string} taskId - ID of the task to validate.
 * @returns {Promise<Object>} - Task document if taskId is valid.
 * @throws {ApolloError} - If task ID is invalid or not found.
 */
async function FindAndValidateTask(taskId) {
  try {
    // *************** validate task id
    ValidateMongoObjectId(taskId);

    // *************** get enter_marks task document with in_progress status
    const taskDocument = await TaskModel.findOne({ _id: taskId, status: 'in_progress', type: 'enter_marks' });
    if (!taskDocument) {
      throw new ApolloError('enter_marks task not found');
    }

    return taskDocument;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'FindAndValidateTask',
      path: '/modules/studentTestResult/studentTestResult.validator.js',
      parameter_input: JSON.stringify({ taskId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Validate marks against the test's notations.
 * @async
 * @param {Object} params - Parameters object.
 * @param {Array<Object>} params.marks - Array of mark entries.
 * @param {string} params.testId - Test ID to fetch notations from.
 * @throws {ApolloError} - If validation fails.
 */
async function ValidateMarks({ marks, testId }) {
  try {
    // *************** call helper to get test's notations
    const testNotations = await GetTestNotations(testId);
    if (!Array.isArray(testNotations) || !testNotations.length) {
      throw new ApolloError("cannot get test's notations");
    }

    // *************** check if marks is provided and is an array
    if (!marks || !Array.isArray(marks)) {
      throw new ApolloError('marks must be an array');
    }

    if (marks.length !== testNotations.length) {
      throw new ApolloError('marks length must match test notations length');
    }

    // *************** validate marks by comparing mark with test's max_point
    for (let pairIndex = 0; pairIndex < marks.length; pairIndex++) {
      // *************** get mark and test's max_point
      const markPoint = marks[pairIndex]?.mark;
      const notationMaxPoint = testNotations[pairIndex]?.max_points;

      // *************** check if mark's element doesn't correspond to notations' element
      if (typeof markPoint !== 'number' || markPoint <= 0) {
        throw new ApolloError(`mark at index ${pairIndex} must be a number`);
      }
      if (markPoint > notationMaxPoint) {
        throw new ApolloError(`mark at index ${pairIndex} cannot exceed notation's max points (${notationMaxPoint})`);
      }
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'ValidateMarksInput',
      path: '/modules/studentTestResult/studentTestResult.validator.js',
      parameter_input: JSON.stringify({ marks, testId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateStudentTestResultFilterInput, FindAndValidateTask, ValidateMarks };
