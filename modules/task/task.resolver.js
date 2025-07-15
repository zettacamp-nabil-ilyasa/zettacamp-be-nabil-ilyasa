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
/**
 * Assign a corrector to a test by completing an `assign_corrector` task.
 * @async
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {Object} args - Resolver arguments.
 * @param {string} args._id - The ID of the `assign_corrector` task to complete.
 * @param {Object} args - The data for assigning the corrector.
 * @param {string} user_id - The ID of the corrector being assigned.
 * @param {string} [due_date] - Optional due date for the associated tasks.
 * @returns {Promise<string>} A success message indicating the corrector was assigned.
 * @throws {ApolloError} If any validation fails or if the task is invalid or already completed.
 */
async function AssignCorrector(parent, { _id, userId, dueDate }) {
  try {
    // *************** validate task's id
    ValidateMongoObjectId(_id);

    // *************** validate assigned corrector's id
    ValidateMongoObjectId(userId);

    // *************** validate due date
    ValidateDueDate(dueDate);

    // *************** get an in-progress assign_corrector task
    const taskDocument = await TaskModel.findOne({ _id, type: 'assign_corrector', status: 'in_progress' }).lean();

    // *************** check if task document really exist to ensure the Test Lifecycle flow is properly followed
    if (!taskDocument) {
      throw new ApolloError('assign_corrector task not found');
    }

    // *************** check if corrector is already assigned
    if (taskDocument.corrector_id) {
      throw new ApolloError('Corrector already assigned');
    }

    // *************** compose task payload, set status to completed and assign userId to corrector
    const updateAssignCorrectorTask = {
      corrector_id: userId,
      status: 'completed',
      completed_at: new Date(),
    };

    // *************** add due_date if provided
    if (dueDate) {
      updateAssignCorrectorTask.due_date = new Date(dueDate);
    }

    // *************** update assign corrector task document to completed
    await TaskModel.updateOne({ _id }, { $set: updateAssignCorrectorTask });

    // *************** call helper to create enter marks tasks to continue the Test Lifecycle
    await CreateEnterMarksTasks({ testId: taskDocument.test_id, userId, dueDate });

    // *************** call helper to send email notification to corrector
    await SendGridNotificationTrigger({ userId, testId: taskDocument.test_id, dueDate });

    return 'Corrector assigned successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'AssignCorrector',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({ _id, userId, dueDate }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Validate a student's marks in the student test result through a task.
 * @async
 * @function ValidateMarks
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {Object} args - Arguments object containing the task ID.
 * @param {string} args._id - The ID of the validation task to be processed.
 * @returns {Promise<string>} A success message if validation completes successfully.
 * @throws {ApolloError} If the task is not found, validation fails, or any other error occurs.
 */
async function ValidateMarks(parent, { _id }) {
  try {
    // *************** validate task's id
    ValidateMongoObjectId(_id);

    // *************** get an in-progress validate_marks task
    const taskDocument = await TaskModel.findOne({ _id, type: 'validate_marks', status: 'in_progress' }).lean();

    // *************** check if task document really exist to ensure the Test Lifecycle flow is properly followed
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
    const toBeDeletedTaskDocument = await TaskModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();
    if (!toBeDeletedTaskDocument) {
      throw new ApolloError('Task not found or already deleted');
    }

    // *************** check if task status is completed, only completed tasks can be deleted
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

// *************** LOADERS ***************
/**
 * Resolve the test_id field in a task document using DataLoader.
 * @async
 * @param {object} parent - The task object containing test_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.test - DataLoader instance for test.
 * @returns {Promise<Object|null>} - The test document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function test_id(parent, args, context) {
  try {
    // *************** check if test_id exist
    if (!parent.test_id) {
      return null;
    }
    // *************** load test
    const test = await context.loaders.test.load(parent.test_id);
    return test;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'test_id',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the user_id field in a task document using DataLoader.
 * @async
 * @param {object} parent - The subject object containing block_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.User - DataLoader instance for user.
 * @returns {Promise<Object|null>} - The user document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function user_id(parent, args, context) {
  try {
    // *************** check if user_id exist
    if (!parent.user_id) {
      return null;
    }
    // *************** load user
    const user = await context.loaders.user.load(parent.user_id);
    return user;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'user_id',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the student_id field in a task document using DataLoader.
 * @async
 * @param {object} parent - The task object containing student_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.User - DataLoader instance for student.
 * @returns {Promise<Object|null>} - The student document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function student_id(parent, args, context) {
  try {
    // *************** check if student_id exist
    if (!parent.student_id) {
      return null;
    }
    // *************** load student
    const student = await context.loaders.student.load(parent.student_id);
    return student;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'student_id',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the corrector_id field in a task document using DataLoader.
 * @async
 * @param {object} parent - The task object containing corrector_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.User - DataLoader instance for user.
 * @returns {Promise<Object|null>} - The user document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function corrector_id(parent, args, context) {
  try {
    // *************** check if corrector_id exist
    if (!parent.corrector_id) {
      return null;
    }
    // *************** load corrector
    const corrector = await context.loaders.user.load(parent.corrector_id);
    return corrector;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'corrector_id',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the user_id field in a task document using DataLoader.
 * @async
 * @param {object} parent - The task object containing student_test_result_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.student_test_result - DataLoader instance for student_test_results.
 * @returns {Promise<Object|null>} - The user document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function student_test_result_id(parent, args, context) {
  try {
    // *************** check if student_test_result_id exist
    if (!parent.student_test_result_id) {
      return null;
    }
    // *************** load student test result
    const studentTestResult = await context.loaders.studentTestResult.load(parent.student_test_result_id);
    return studentTestResult;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'student_test_result_id',
      path: '/modules/task/task.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllTasks, GetOneTask },
  Mutation: { DeleteTask, AssignCorrector, ValidateMarks },
  Task: {
    user_id,
    student_id,
    corrector_id,
    test_id,
    student_test_result_id,
  },
};
