//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULES ***************
const UserModel = require('./user.model');
const ErrorLogModel = require('../errorLog/error_log.model.js');

//*************** IMPORT UTILS ***************
const { ValidateId } = require('../../utils/common-validator');

//*************** list of protected roles
const protectedRoles = ['user'];

/**
 * Check if a User with the given ID already exists.
 * @param {string} userId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed in validation or db operation.
 */
async function UserIsExist(userId) {
  try {
    //*************** validate userId
    ValidateId(userId);

    //*************** set query for db operation
    const query = { _id: userId, status: 'active' };

    //*************** db operation
    const isUserExist = Boolean(await UserModel.exists(query));
    return isUserExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserIsExist',
      path: '/graphql/user/user.helpers.js',
      parameter_input: JSON.stringify({ userId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if user email already exist
 * @param {string} userEmail - The email to be checked.
 * @param {string} userId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in validation or db operation.
 */
async function UserEmailIsExist({ userEmail, userId = null }) {
  try {
    //*************** check if email is empty
    if (!userEmail) {
      throw new ApolloError('Invalid email input');
    }

    //*************** validate userId
    if (userId) {
      ValidateId(userId);
    }

    //*************** set query for db operation
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
      path: '/graphql/user/user.helpers.js',
      parameter_input: JSON.stringify({ userEmail, userId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if role is valid
 * @param {string} role - The role to be checked.
 * @throws {Error} - If failed validation.
 */
function RoleIsValid(role) {
  //*************** role input check
  if (!role) {
    throw new ApolloError('Invalid role input');
  }

  const validRoles = ['admin', 'user'];

  //*************** check if role is a valid role
  const isValidRole = validRoles.includes(role);
  if (!isValidRole) {
    throw new ApolloError('Invalid role');
  }
}

/**
 * Check if role can be removed.
 * @param {string} role - The role to be checked.
 * @returns {boolean} - True if role can be removed, false otherwise.
 * @throws {Error} - If validation fails.
 */
function IsRemovableRole(role) {
  //*************** role input check, set to lowercase
  if (!role) {
    throw new ApolloError('Invalid role input');
  }

  //*************** check if role is not a protected role
  const isRemovableRole = !protectedRoles.includes(role);
  return isRemovableRole;
}

/**
 * Check is a user already have the given role.
 * @param {string} userId - The id of the user.
 * @param {string} role - The role to be checked.
 * @returns {promise<boolean>} - True if user already have the role, false otherwise.
 * @throws {Error} - If failed in validation or db operation.
 */
async function UserHasRole({ userId, role }) {
  try {
    //*************** validate userId
    ValidateId(userId);

    //*************** role input check
    if (!role) {
      throw new ApolloError('Invalid role input');
    }

    //*************** set query for db operation
    const query = { _id: userId, roles: role };

    //*************** db operation
    const isUserHasRole = Boolean(await UserModel.exists(query));
    return isUserHasRole;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserHasRole',
      path: '/graphql/user/user.helpers.js',
      parameter_input: JSON.stringify({ userId, role }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************

module.exports = {
  UserIsExist,
  UserEmailIsExist,
  RoleIsValid,
  IsRemovableRole,
  UserHasRole,
};
