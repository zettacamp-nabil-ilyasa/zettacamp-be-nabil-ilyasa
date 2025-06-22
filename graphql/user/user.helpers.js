//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const bcrypt = require('bcrypt');

//*************** IMPORT MODULE ***************
const UserModel = require('./user.model');
const StudentModel = require('../student/student.model');

//*************** IMPORT UTILS ***************
const { SanitizeAndValidateId } = require('../../utils/common-validator');
const { LogErrorToDb } = require('../../utils/common');

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
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { userId } });

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
async function UserHasRole(userId, role) {
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
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { userId, role } });

    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} userId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user is referenced by a student, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserIsReferencedByStudent(userId) {
  try {
    //*************** userId input check
    const validatedUserId = SanitizeAndValidateId(userId);

    //*************** set query for db operation
    const query = { user_id: validatedUserId, status: 'active' };

    //*************** db operation
    const isReferenced = Boolean(await StudentModel.exists(query));
    return isReferenced;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { userId } });

    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} password - Plaintext to be hashed.
 * @returns string - Hashed password.
 * @throws {Error} - If failed sanity check or hashing process.
 */
async function HashPassword(password) {
  try {
    //*************** password input check
    if (typeof password !== 'string') {
      throw new ApolloError('Invalid password input');
    }
    const trimmedPassword = password.trim();
    if (trimmedPassword === '') {
      throw new ApolloError('Invalid password input');
    }

    const saltRounds = 10;

    //*************** hash password using bcrypt
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { password } });

    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************

module.exports = {
  UserIsExist,
  NormalizeRole,
  IsRemovableRole,
  UserHasRole,
  HashPassword,
  UserIsReferencedByStudent,
};
