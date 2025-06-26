// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const UserModel = require('./user.model');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTILS ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

// *************** IMPORT VALIDATORS ***************
const { ValidateRole } = require('./user.validators.js');

// *************** list of protected roles
const protectedRoles = ['user'];

/**
 * Check if a user with the given ID exists and is active.
 * @async
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<boolean>} - True if the user exists and is active, false otherwise.
 * @throws {ApolloError} - If validation fails or DB query fails.
 */
async function UserIsExist(userId) {
  try {
    // *************** validate userId
    ValidateId(userId);

    // *************** set query for db operation
    const query = { _id: userId, status: 'active' };

    // *************** db operation
    const isUserExist = Boolean(await UserModel.exists(query));
    return isUserExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserIsExist',
      path: '/modules/user/user.helpers.js',
      parameter_input: JSON.stringify({ userId }),
    });
    throw new ApolloError(error.message);
  }
}

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

/**
 * Check if a role is removable (not protected).
 * @param {string} role - The role to validate and check.
 * @returns {boolean} - True if the role can be removed, false otherwise.
 * @throws {ApolloError} - If the role is invalid.
 */
function IsRemovableRole(role) {
  // *************** validate role
  ValidateRole(role);

  // *************** check if role is not a protected role
  const isRemovableRole = !protectedRoles.includes(role);
  return isRemovableRole;
}

/**
 * Check if a user already has a specific role.
 * @async
 * @param {object} params - Input parameters.
 * @param {string} params.userId - The ID of the user.
 * @param {string} params.role - The role to check for.
 * @returns {Promise<boolean>} - True if the user has the role, false otherwise.
 * @throws {ApolloError} - If validation fails or DB query fails.
 */
async function UserHasRole({ userId, role }) {
  try {
    // *************** validate userId
    ValidateId(userId);

    // *************** role input check
    ValidateRole(role);

    // *************** set query for db operation
    const query = { _id: userId, roles: role };

    // *************** db operation
    const isUserHasRole = Boolean(await UserModel.exists(query));
    return isUserHasRole;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserHasRole',
      path: '/modules/user/user.helpers.js',
      parameter_input: JSON.stringify({ userId, role }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  UserIsExist,
  UserEmailIsExist,
  IsRemovableRole,
  UserHasRole,
};
