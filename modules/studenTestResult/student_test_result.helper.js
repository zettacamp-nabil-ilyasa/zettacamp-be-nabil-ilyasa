// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TestModel = require('../test/test.model.js');
const TaskModel = require('../task/task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Retrieve notations from a published test.
 * @async
 * @param {string} testId - The id of the test document.
 * @returns {Promise<Array>} - Array of notation objects.
 * @throws {ApolloError} - If test not found or error occurs during DB operation.
 */
async function GetTestNotations(testId) {
  try {
    // *************** validate test's id
    ValidateMongoObjectId(testId);

    // *************** get test document
    const testDocument = await TestModel.findOne({ _id: testId, status: 'published' });
    if (!testDocument) {
      throw new ApolloError('test not found');
    }

    return testDocument.notations;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetTestNotations',
      path: '/modules/studentTestResult/studentTestResult.helper.js',
      parameter_input: JSON.stringify({ testId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Compose payload object for creating a StudentTestResult document in enter marks mutation.
 * @param {Object} params - Parameters.
 * @param {Object} params.taskDocument - The task document related to enter_marks.
 * @param {Array} params.marks - Array of mark objects.
 * @returns {Object} - Formatted payload for creating StudentTestResult.
 * @throws {ApolloError} - If task or marks are missing.
 */
function EnterMarksPayloadComposer({ taskDocument, marks }) {
  // *************** sanity check
  if (!taskDocument || !Array.isArray(marks) || !marks.length) {
    throw new ApolloError('task or marks not found');
  }

  const averageMark = marks.reduce((acc, mark) => acc + mark.mark, 0) / marks.length;

  return {
    task_id: taskDocument._id,
    test_id: taskDocument.test_id,
    student_id: taskDocument.student_id,
    marks: marks,
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

