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
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserIsExist(userId) {
  try {
    //*************** userId input check
    ValidateId(userId);

    //*************** set query for db operation
    const query = { _id: userId, status: 'active' };

    //*************** db operation
    const userIsExist = Boolean(await UserModel.exists(query));
    return userIsExist;
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
 * @param {string} email - The email to be checked.
 * @param {string} _id - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserEmailIsExist({ email, _id = null }) {
  try {
    //*************** check if email is empty
    if (!email) {
      throw new ApolloError('Invalid email input');
    }

    //*************** validate _id
    if (_id) {
      ValidateId(_id);
    }

    //*************** set query for db operation
    const query = { email };
    if (_id) {
      query._id = { $ne: _id };
    }

    const emailIsExist = Boolean(await UserModel.exists(query));
    return emailIsExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserEmailIsExist',
      path: '/graphql/user/user.helpers.js',
      parameter_input: JSON.stringify({ email, _id }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if role is valid
 * @param {string} role - The role to be checked.
 * @throws {Error} - If failed sanity check.
 */
function RoleIsValid(role) {
  //*************** role input check, set to lowercase
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
 * @throws {Error} - If failed sanity check.
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
 * @param {string} _id - The id of the user.
 * @param {string} role - The role to be checked.
 * @returns {promise<boolean>} - True if user already have the role, false otherwise.
 * @throws {Error} - If failed sanity check or db operation.
 */
async function UserHasRole({ _id, role }) {
  try {
    //*************** userId input check
    ValidateId(_id);

    //*************** role input check, set to lowercase
    if (!role) {
      throw new ApolloError('Invalid role input');
    }

    //*************** set query for db operation
    const query = { _id, roles: role };

    //*************** db operation
    const isUserHasRole = Boolean(await UserModel.exists(query));
    return isUserHasRole;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserHasRole',
      path: '/graphql/user/user.helpers.js',
      parameter_input: JSON.stringify({ _id, role }),
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
