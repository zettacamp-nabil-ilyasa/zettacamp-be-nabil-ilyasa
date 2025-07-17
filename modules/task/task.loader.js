// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TaskModel = require('./task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Batch function to load multiple tasks by their IDs.
 * @async
 * @param {Array<string>} taskIds - Array of task IDs to fetch.
 * @returns {Promise<Array<Object|null>>} - Array of task objects aligned with input IDs.
 * @throws {ApolloError} - If database query or processing fails.
 */
async function BatchTasks(taskIds) {
  try {
    // *************** validate each task id
    taskIds.forEach((taskId) => {
      ValidateMongoObjectId(taskId);
    });

    // *************** get all active task with id within taskIds and status is active
    const tasks = await TaskModel.find({ _id: { $in: taskIds }, status: { $ne: 'deleted' } }).lean();

    // *************** set tasks data to dataMap
    const dataMap = new Map();
    tasks.forEach((task) => {
      dataMap.set(String(task._id), task);
    });

    // *************** return array of task objects with order of taskIds
    return taskIds.map((taskId) => dataMap.get(String(taskId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchTasks',
      path: '/modules/task/task.loader.js',
      parameter_input: JSON.stringify({ taskIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching tasks by task IDs
 * @returns {DataLoader<string, Object>} - A DataLoader instance that loads tasks by task ID
 */
function TaskLoader() {
  return new DataLoader(BatchTasks);
}

// *************** EXPORT MODULE ***************
module.exports = {
  TaskLoader,
};
