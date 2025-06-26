// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

/**
 * Batch function to load multiple users by their IDs.
 * @param {Array<string>} userIds - Array of user IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of user objects aligned with input IDs.
 * @throws {ApolloError} - If database query fails.
 */
async function BatchUsers(userIds) {
  try {
    //**************** get all active users with id within userIds and status is not deleted
    const users = await UserModel.find({ _id: { $in: userIds }, status: 'active' }).lean();

    //**************** set users data to dataMap
    const dataMap = new Map();
    users.forEach((user) => {
      dataMap.set(String(user._id), user);
    });

    //**************** return array of user objects with order of userIds
    return userIds.map((userId) => dataMap.get(String(userId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchUsers',
      path: '/graphql/user/user.loader.js',
      parameter_input: JSON.stringify({ userIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching users by user IDs
 * @returns {DataLoader<string, Object} A DataLoader instance that loads users by user ID
 */
function UserLoader() {
  return new DataLoader(BatchUsers);
}

// *************** EXPORT MODULE ***************
module.exports = {
  UserLoader,
};
