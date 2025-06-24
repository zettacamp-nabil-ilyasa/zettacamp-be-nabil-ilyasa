//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULES ***************
const UserModel = require('./user.model');
const ErrorLogModel = require('../errorLog/error_log.model.js');

//*************** IMPORT UTILS ***************
const { SanitizeAndValidateId } = require('../../utils/common-validator');

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
    const validatedUserId = SanitizeAndValidateId(userId);

    //*************** set query for db operation
    const query = { _id: validatedUserId, status: 'active' };

    //*************** db operation
    const count = await UserModel.countDocuments(query);

    const userIsExist = count > 0;
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
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserEmailIsExist({ emailAcc, excludeId = null }) {
  try {
    //*************** sanity check
    if (typeof emailAcc !== 'string' || emailAcc.trim() === '') {
      throw new ApolloError('Invalid email input');
    }
    let trimmedExcludeId = '';
    if (excludeId) {
      if (typeof excludeId !== 'string' || excludeId.trim() === '' || !mongoose.Types.ObjectId.isValid(excludeId.trim())) {
        throw new ApolloError('Invalid exclude id input');
      }
      trimmedExcludeId = excludeId.trim();
    }

    //*************** set query for db operation
    const query = { email: emailAcc.toLowerCase() };
    if (excludeId) {
      query._id = { $ne: trimmedExcludeId };
    }

    const count = await UserModel.countDocuments(query);
    return count > 0;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserEmailIsExist',
      path: '/graphql/user/user.helpers.js',
      parameter_input: JSON.stringify({ emailAcc, excludeId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if role is valid
 * @param {string} role - The role to be checked.
 * @returns {string} - Role in lowercase.
 * @throws {Error} - If failed sanity check.
 */
function NormalizeRole(role) {
  //*************** role input check, set to lowercase
  if (typeof role !== 'string') {
    throw new ApolloError('Invalid role input');
  }
  const roleLowerCase = role.trim().toLowerCase();
  if (roleLowerCase === '') {
    throw new ApolloError('Invalid role input');
  }

  const validRoles = ['admin', 'user', 'student'];

  //*************** check if role is a valid role
  const isValidRole = validRoles.includes(roleLowerCase);
  if (!isValidRole) {
    throw new ApolloError('Invalid role');
  }
  return roleLowerCase;
}

/**
 * Check if role can be removed.
 * @param {string} role - The role to be checked.
 * @returns {boolean} - True if role can be removed, false otherwise.
 * @throws {Error} - If failed sanity check.
 */
function IsRemovableRole(role) {
  //*************** role input check, set to lowercase
  if (typeof role !== 'string') {
    throw new ApolloError('Invalid role input');
  }
  const roleLowerCase = role.trim().toLowerCase();
  if (roleLowerCase === '') {
    throw new ApolloError('Invalid role input');
  }

  //*************** check if role is not a protected role
  const isRemovableRole = !protectedRoles.includes(roleLowerCase);
  return isRemovableRole;
}

/**
 * Check is a user already have the given role.
 * @param {string} userId - The id of the user.
 * @param {string} role - The role to be checked.
 * @returns {promise<boolean>} - True if user already have the role, false otherwise.
 * @throws {Error} - If failed sanity check or db operation.
 */
async function UserHasRole({ userId, role }) {
  try {
    //*************** userId input check
    const validatedUserId = SanitizeAndValidateId(userId);

    //*************** role input check, set to lowercase
    if (typeof role !== 'string') {
      throw new ApolloError('Invalid role input');
    }
    const roleLowerCase = role.trim().toLowerCase();
    if (roleLowerCase === '') {
      throw new ApolloError('Invalid role input');
    }

    //*************** set query for db operation
    const query = { _id: validatedUserId, roles: roleLowerCase };

    //*************** db operation
    const count = await UserModel.countDocuments(query);
    const roleIsAlreadyExists = count > 0;
    return roleIsAlreadyExists;
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
  NormalizeRole,
  IsRemovableRole,
  UserHasRole,
};
