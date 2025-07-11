// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentTestResultModel = require('./studentTestResult.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateStudentTestResultFilterInput } = require('./studentTestResult.validators.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// **************** QUERY ****************
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
async function GetAllStudentTestResults({ filterInput, paginationInput }) {
  try {
    // **************** validate filterInput if provided
    if (filterInput) {
      ValidateStudentTestResultFilterInput(filterInput);
    }

    // **************** validate paginationInput if provided
    if (paginationInput) {
      ValidatePaginationInput(paginationInput);
    }

    // **************** build base query
    const query = { status: { $ne: deleted } };

    // **************** add test_id filter if provided
    if (filterInput?.test_id) {
      query.test_id = filterInput.test_id;
    }

    // **************** add status filter if provided
    if (filterInput?.status) {
      query.status = filterInput.status;
    }

    // **************** execute query
    const studentTestResults = await StudentTestResultModel.find(query)
      .skip(paginationInput?.offset || 0)
      .limit(paginationInput?.limit || 20)
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
