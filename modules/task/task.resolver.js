// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TaskModel = require('./task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateTaskFilterInput, ValidateDueDate } = require('./task.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** IMPORT HELPER ***************
const { CreateEnterMarksTasks, SendGridNotificationTrigger, MarkStudentTestResultAsValidated } = require('./task.helper.js');

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
 * @returns {Promise<Array<Object>>} Array of task documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllTasks(parent, { filter, pagination }) {
  try {
    // *************** validate status and type within filterInput
    ValidateTaskFilterInput(filter);

    // *************** validate limit and offset within paginationInput
    ValidatePaginationInput(pagination);

    // *************** build base query
    const query = { status: { $ne: 'deleted' } };

    // *************** build query for subject_id if it exist
    if (filter?.type) {
      query.type = filter.type;
    }

    // *************** build query for status if it exist
    if (filter?.status) {
      query.status = filter.status;
    }

    // *************** set default limit and offset
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? 20;

    // *************** execute query
    const tasks = await TaskModel.find(query)
      .skip(offset || 0)
      .limit(limit || 20)
      .sort({ created_at: -1 })
      .lean();
    return tasks;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllTasks',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ filter, pagination }),
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

// *************** MUTATION ****************
async function AssignCorrector(parent, { _id, input }) {
  try {
    // *************** validate task's id
    ValidateMongoObjectId(_id);

    // *************** validate assigned corrector's id
    ValidateMongoObjectId(input.user_id);

    // *************** validate due date
    ValidateDueDate(input.due_date);

    // *************** get task document
    const taskDocument = await TaskModel.findOne({ _id, type: 'assign_corrector', status: 'in_progress' }).lean();
    if (!taskDocument) {
      throw new ApolloError('assign_corrector task not found');
    }

    // *************** check if corrector is already assigned
    if (taskDocument.corrector_id) {
      throw new ApolloError('Corrector already assigned');
    }

    // *************** update task document to completed
    const updateAssignCorrectorTask = {
      corrector_id: input.user_id,
      status: 'completed',
      completed_at: new Date(),
    };

    // *************** add due_date if provided
    if (input.due_date) {
      updateAssignCorrectorTask.due_date = new Date(input.due_date);
    }

    // *************** update assign corrector task document to completed
    await TaskModel.updateOne({ _id }, { $set: updateAssignCorrectorTask });

    // *************** call helper to create enter marks tasks
    await CreateEnterMarksTasks({ testId: taskDocument.test_id, userId: input.user_id, dueDate: input.due_date });

    // *************** call helper to send email notification to corrector
    await SendGridNotificationTrigger({ userId: input.user_id, testId: taskDocument.test_id, dueDate: input.due_date });

    return 'Corrector assigned successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'AssignCorrector',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

async function ValidateMarks(parent, { _id }) {
  try {
    // *************** validate task's id
    ValidateMongoObjectId(_id);

    // *************** get task document
    const taskDocument = await TaskModel.findOne({ _id, type: 'validate_marks', status: 'in_progress' }).lean();
    if (!taskDocument) {
      throw new ApolloError('validate marks task not found');
    }

    // *************** call helper to mark student test result as validated
    await MarkStudentTestResultAsValidated(taskDocument.student_test_result_id);

    // *************** update task document
    await TaskModel.updateOne({ _id }, { $set: { status: 'completed', completed_at: new Date() } });

    return 'Marks validated successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'ValidateMarks',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a task by marking its status as 'deleted'.
 * Prevents deletion if task status is not 'completed'.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the task to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if task not found or status is not completed.
 */
async function DeleteTask(parent, { _id }) {
  try {
    // *************** validate _id
    ValidateMongoObjectId(_id);

    // *************** get task document
    const toBeDeletedTaskDocument = await TaskModel.findOne({ _id, status: { $ne: 'deleted' } });
    if (!toBeDeletedTaskDocument) {
      throw new ApolloError('Task not found or already deleted');
    }

    if (toBeDeletedTaskDocument.status !== 'completed') {
      throw new ApolloError('Only completed tasks can be deleted');
    }

    // *************** update status to deleted and set deleted_at
    await TaskModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_at: new Date() } });
    return 'task deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteTask',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllTasks, GetOneTask },
  Mutation: { DeleteTask, AssignCorrector, ValidateMarks },
};
