// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TaskModel = require('./test.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateTaskFilterInput } = require('./task.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** QUERY ****************
/**
 * Get all tasks with optional filtering by type, status and pagination.
 * @async
 * @function GetAllTasks
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {String} [filterInput.type] - Optional type to filter tasks
 * @param {String} [filterInput.status] - Optional status to filter tasks
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {Number} [paginationInput.limit] - Number of tasks per page
 * @param {Number} [paginationInput.offset] - Number of tasks to skip
 * @returns {Promise<Array<Object>>} Array of test documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllTasks({ filterInput, paginationInput }) {
  try {
    // *************** validate status and type within filterInput
    ValidateTaskFilterInput(filterInput);

    // *************** validate limit and offset within paginationInput
    ValidatePaginationInput(paginationInput);

    // *************** build base query
    const query = { status: { $ne: 'deleted' } };

    // *************** build query for subject_id if it exist
    if (filterInput?.type) {
      query.type = filterInput.type;
    }

    // *************** build query for status if it exist
    if (filterInput?.status) {
      query.status = filterInput.status;
    }

    // *************** execute query
    const tasks = await TaskModel.find(query)
      .skip(paginationInput?.offset || 0)
      .limit(paginationInput?.limit || 20)
      .sort({ created_at: -1 })
      .lean();
    return tasks;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllTasks',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ filterInput, paginationInput }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one not-deleted task by its ID.
 * @async
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {String} _id - ID of the task to retrieve.
 * @returns {Promise<Object|null>} - Task document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneTask(parent, { _id }) {
  try {
    // *************** validate _id
    ValidateMongoObjectId(_id);

    // *************** get the task document
    const task = await TaskModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // *************** check if task document exist
    if (!task) {
      throw new ApolloError('Task not found or already deleted');
    }
    return task;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneTask',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}
