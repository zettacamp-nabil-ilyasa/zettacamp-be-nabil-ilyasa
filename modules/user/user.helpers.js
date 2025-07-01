// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const UserModel = require('./user.model');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTIL ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

/**
 * Check if a user email already exists in the database.
 * @async
 * @param {object} params - Input parameters.
 * @param {string} params.userEmail - The email to check.
 * @param {string} [params.userId] - The user ID to exclude (optional).
 * @returns {Promise<boolean>} - True if the email exists, false otherwise.
 * @throws {ApolloError} - If input is invalid or DB query fails.
 */
async function UserEmailIsExist({ userEmail, userId }) {
  try {
    // *************** check if email is empty
    if (!userEmail) {
      throw new ApolloError('Invalid email input');
    }

    // *************** validate userId
    if (userId) {
      ValidateId(userId);
    }

    // *************** set query for db operation
    const query = { email: userEmail };
    if (userId) {
      query._id = { $ne: userId };
    }

    const isEmailExist = Boolean(await UserModel.exists(query));
    return isEmailExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserEmailIsExist',
      path: '/modules/user/user.helpers.js',
      parameter_input: JSON.stringify({ userEmail, userId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  UserEmailIsExist,
};
