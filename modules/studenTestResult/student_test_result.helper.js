// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TestModel = require('../test/test.model.js');
const TaskModel = require('../task/task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Compare test notations and marks.
 * Ensure that each notation has a corresponding mark
 * @async
 * @param {Object} marks - Array of mark objects.
 * @param {string} testId - The id of the test document.
 * @returns {Promise<Array>} - Array of notation objects.
 * @throws {ApolloError} - If test not found or error occurs during DB operation.
 */
async function CompareTestNotationsAndMarks({ marks, testId }) {
  try {
    // *************** validate test's id
    ValidateMongoObjectId(testId);

    // *************** get published test, ensure that only published test can be compared for enter marks process
    const testDocument = await TestModel.findOne({ _id: testId, status: 'published' });
    if (!testDocument) {
      throw new ApolloError('published test not found');
    }

    // *************** ensure that each notation has a corresponding mark
    if (marks.length !== testDocument.notations.length) {
      throw new ApolloError('marks and notations do not match');
    }

    marks.forEach((mark, index) => {
      if (mark.mark > testDocument.notations[index].max_points) {
        throw new ApolloError(`mismatch between marks and notations in index ${index}`);
      }
    });
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CompareTestNotationsAndMarks',
      path: '/modules/studentTestResult/studentTestResult.helper.js',
      parameter_input: JSON.stringify({ marks, testId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Compose payload object for creating a StudentTestResult document in enter marks mutation.
 * @param {Object} params - Parameters.
 * @param {Object} params.taskDocument - The task document related to enter_marks.
 * @param {Array} params.studentMarks - Array of mark objects.
 * @returns {Object} - Formatted payload for creating StudentTestResult.
 * @throws {ApolloError} - If task or marks are missing.
 */
function EnterMarksPayloadComposer({ taskDocument, studentMarks }) {
  // *************** sanity check
  if (!taskDocument || !Array.isArray(studentMarks) || !studentMarks.length) {
    throw new ApolloError('task or marks not found');
  }

  // *************** calculate average mark, ensure that average mark only has 2 decimal
  const averageMark = Math.round((studentMarks.reduce((acc, studentMark) => acc + studentMark.mark, 0) / studentMarks.length) * 100) / 100;

  // *************** compose payload
  return {
    task_id: taskDocument._id,
    test_id: taskDocument.test_id,
    student_id: taskDocument.student_id,
    marks: studentMarks,
    average_mark: averageMark,
    status: 'completed',
    mark_entry_date: new Date(),
  };
}

/**
 * Set status of an enter_marks task to 'completed'.
 * @async
 * @param {string} taskId - The Id of the task to update.
 * @returns {Promise<void>}
 * @throws {ApolloError} - If update fails or task is not modified.
 */
async function SetEnterMarksTaskToCompleted(taskId) {
  try {
    // *************** validate task id
    ValidateMongoObjectId(taskId);

    // *************** update task document
    const updatedTask = await TaskModel.updateOne({ _id: taskId, status: 'in_progress' }, { $set: { status: 'completed' } });
    if (updatedTask.modifiedCount === 0) {
      throw new ApolloError('failed to update task');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SetEnterMarksTaskToCompleted',
      path: '/modules/studentTestResult/studentTestResult.helper.js',
      parameter_input: JSON.stringify({ taskId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a validate_marks task assigned to a user.
 * @async
 * @param {Object} params - Parameters.
 * @param {string} params.studentTestResultId - ID of the student test result.
 * @param {string} params.userId - ID of the user (typically academic director, hardcoded for now).
 * @returns {Promise<void>}
 * @throws {ApolloError} - If creation fails.
 */
async function CreateValidateMarksTask({ studentTestResultId, userId, taskDocument }) {
  try {
    // *************** validate student test result id
    ValidateMongoObjectId(studentTestResultId);

    // *************** create validate marks task
    const createdTask = await TaskModel.create({
      type: 'validate_marks',
      user_id: userId,
      test_id: taskDocument.test_id,
      student_id: taskDocument.student_id,
      student_test_result_id: studentTestResultId,
      status: 'in_progress',
    });
    if (!createdTask) {
      throw new ApolloError('failed to create validate marks task');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateValidateMarksTask',
      path: '/modules/studentTestResult/studentTestResult.helper.js',
      parameter_input: JSON.stringify({ studentTestResultId, userId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { CompareTestNotationsAndMarks, EnterMarksPayloadComposer, SetEnterMarksTaskToCompleted, CreateValidateMarksTask };
