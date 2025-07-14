// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentTestResultModel = require('./student_test_result.model.js');
const TaskModel = require('../task/task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateStudentTestResultFilterInput, ValidateMarks, FindAndValidateTask } = require('./studentTestResult.validators.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// *************** IMPORT HELPER ***************
const { EnterMarksPayloadComposer, CreateValidateMarksTask, SetEnterMarksTaskToCompleted } = require('./student_test_result.helper.js');

// *************** QUERY ****************
/**
 * Get all studentTestResult with optional filtering by test_id, status, and pagination.
 * @async
 * @function GetAllStudentTestResult
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {string} [filterInput.test_id] - Optional test ID to filter studentTestResult
 * @param {string} [filterInput.status] - Optional test ID to filter studentTestResult
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {number} [paginationInput.limit] - Number of tests per page
 * @param {number} [paginationInput.offset] - Number of tests to skip
 * @returns {Promise<Array<Object>>} Array of test documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllStudentTestResults(parent, { filter, pagination }) {
  try {
    // *************** validate filterInput if provided
    if (filter) {
      ValidateStudentTestResultFilterInput(filter);
    }

    // *************** validate paginationInput if provided
    if (pagination) {
      ValidatePaginationInput(pagination);
    }

    // *************** build base query
    const query = { status: { $ne: 'deleted' } };

    // *************** add test_id filter if provided
    if (filter?.test_id) {
      query.test_id = filter.test_id;
    }

    // *************** add status filter if provided
    if (filter?.status) {
      query.status = filter.status;
    }

    // *************** set default limit and offset
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? 20;

    // *************** execute query
    const studentTestResults = await StudentTestResultModel.find(query)
      .skip(offset || 0)
      .limit(limit || 20)
      .sort({ created_at: -1 })
      .lean();
    return studentTestResults;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllStudentTestResult',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ filterInput, paginationInput }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one not-deleted student test result by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student test result to retrieve.
 * @returns {Promise<Object>} - Student test result document or error if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneStudentTestResult(parent, { _id }) {
  try {
    // *************** validate studentTestResult's id
    ValidateMongoObjectId(_id);

    // *************** get studentTestResult's document
    const studentTestResult = await StudentTestResultModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // *************** check if studentTestResult is exist
    if (!studentTestResult) {
      throw new ApolloError("student test result doesn't exist or already deleted");
    }
    return studentTestResult;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneStudentTestResult',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a student test result by marking its status as 'deleted'.
 * Also deletes associated task.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student test result to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if student test result not found or the status is is not 'validated'.
 */
async function DeleteStudentTestResult(parent, { _id }) {
  try {
    // *************** validate student test result's id
    ValidateMongoObjectId(_id);

    // *************** get the student test result document
    const toBeDeletedStudentTestResultDocument = await StudentTestResultModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // *************** check if the student test result is exist
    if (!toBeDeletedStudentTestResultDocument) {
      throw new ApolloError("student test result doesn't exist or already deleted");
    }

    // *************** check if the student test result's status is not validated
    if (toBeDeletedStudentTestResultDocument.status !== 'validated') {
      throw new ApolloError('only validated student test result that can be deleted');
    }

    // *************** soft-delete the student test result document by set status and deleted_at
    await StudentTestResultModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_at: new Date() } });

    // *************** also soft-delete task that stores the student test result's id
    await TaskModel.updateOne(
      { _id: toBeDeletedStudentTestResultDocument.task_id },
      { $set: { status: 'deleted', deleted_at: new Date() } }
    );

    return 'student test result is succesfully deleted';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteStudentTestResult',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudentTestResults, GetOneStudentTestResult },
  StudentTestResult: {
    task_id,
    test_id,
    student_id,
  },
};
