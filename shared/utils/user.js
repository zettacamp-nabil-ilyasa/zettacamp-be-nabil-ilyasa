// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const ErrorLogModel = require('../../modules/errorLog/error_log.model.js');
const UserModel = require('../../modules/user/user.model.js');

// *************** IMPORT UTIL ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

/**
 * Check if a user with the given ID has the "admin" role.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 * @throws {ApolloError} - If validation fails or database operation errors occur.
 */
async function UserIsAdmin(userId) {
  try {
    // *************** validate userId
    ValidateId(userId);

    // *************** set query for db operation
    const query = { _id: userId, roles: 'admin', status: 'active' };
    const isUserAdmin = Boolean(await UserModel.exists(query));
    return isUserAdmin;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserIsAdmin',
      path: '/shared/utils/user.js',
      parameter_input: JSON.stringify({ userId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  UserIsAdmin,
};
