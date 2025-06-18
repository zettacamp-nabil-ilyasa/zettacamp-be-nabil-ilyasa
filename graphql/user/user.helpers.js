//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//*************** IMPORT MODULE ***************
const UserModel = require('./user.model');
const StudentModel = require('../student/student.model');

//*************** IMPORT UTILS ***************
const { ToTitleCase } = require('../../utils/common');

//*************** regex pattern to ensure email is includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/;
//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//*************** regex pattern to ensure first and last name contains only letters
const firstAndLastNameRegexPattern = /^[a-zA-Z\s'-]+$/;

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
    if (typeof userId !== 'string') {
      throw new Error('Invalid user id input');
    }
    const trimmedUserId = userId.trim();
    if (trimmedUserId === '' || !mongoose.Types.ObjectId.isValid(trimmedUserId)) {
      throw new Error('Invalid user id input');
    }

    //*************** set query for db operation
    const query = { _id: trimmedUserId, status: 'active' };

    //*************** db operation
    const count = await UserModel.countDocuments(query);

    const userIsExist = count > 0;
    return userIsExist;
  } catch (error) {
    throw new Error(error.message);
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
    throw new Error('Invalid role input');
  }
  const roleLowerCase = role.trim().toLowerCase();
  if (roleLowerCase === '') {
    throw new Error('Invalid role input');
  }

  const validRoles = ['admin', 'user', 'student'];

  //*************** check if role is a valid role
  const isValidRole = validRoles.includes(roleLowerCase);
  if (!isValidRole) {
    throw new Error('Invalid role');
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
    throw new Error('Invalid role input');
  }
  const roleLowerCase = role.trim().toLowerCase();
  if (roleLowerCase === '') {
    throw new Error('Invalid role input');
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
    if (typeof userId !== 'string') {
      throw new Error('Invalid user id input');
    }
    const trimmedUserId = userId.trim();
    if (trimmedUserId === '' || !mongoose.Types.ObjectId.isValid(trimmedUserId)) {
      throw new Error('Invalid user id input');
    }

    //*************** role input check, set to lowercase
    if (typeof role !== 'string') {
      throw new Error('Invalid role input');
    }
    const roleLowerCase = role.trim().toLowerCase();
    if (roleLowerCase === '') {
      throw new Error('Invalid role input');
    }

    //*************** set query for db operation
    const query = { _id: trimmedUserId, roles: roleLowerCase };

    //*************** db operation
    const count = await UserModel.countDocuments(query);
    const roleIsAlreadyExists = count > 0;
    return roleIsAlreadyExists;
  } catch (error) {
    throw new Error(error.message);
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
    if (typeof userId !== 'string') {
      throw new Error('Invalid user id input');
    }
    const trimmedUserId = userId.trim();
    if (trimmedUserId === '' || !mongoose.Types.ObjectId.isValid(trimmedUserId)) {
      throw new Error('Invalid user id input');
    }

    //*************** set query for db operation
    const query = { user_id: trimmedUserId, status: 'active' };

    //*************** db operation
    const isReferenced = Boolean(await StudentModel.exists(query));
    return isReferenced;
  } catch (error) {
    throw new Error(error.message);
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
      throw new Error('Invalid password input');
    }
    const trimmedPassword = password.trim();
    if (trimmedPassword === '') {
      throw new Error('Invalid password input');
    }

    const saltRounds = 10;

    //*************** hash password using bcrypt
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserCreateInput(input) {
  let { first_name, last_name, email, password, role } = input;

  if (!emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (!passwordRegexPattern.test(password)) {
    throw new Error(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  //*************** convert first_name and last_name to Title case
  first_name = ToTitleCase(first_name);
  last_name = ToTitleCase(last_name);

  const validatedInput = { first_name, last_name, email, password, role };
  return validatedInput;
}

/**
 * Validates user update input.
 * @param {object} input - The input object containing updated user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserUpdateInput(input) {
  let { _id, first_name, last_name, email, password } = input;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new Error('invalid user id');
  }
  if (email && !emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (password && !passwordRegexPattern.test(password)) {
    throw new Error(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (first_name) {
    if (!firstAndLastNameRegexPattern.test(first_name)) {
      throw new Error('first name contains invalid characters');
    }
    //*************** convert first_name to Title case
    first_name = ToTitleCase(first_name);
  }
  if (last_name) {
    if (!firstAndLastNameRegexPattern.test(last_name)) {
      throw new Error('last name contains invalid characters');
    }
    //*************** convert last_name to Title case
    last_name = ToTitleCase(last_name);
  }
  const validatedInput = { _id, first_name, last_name, email, password };
  return validatedInput;
}

// *************** EXPORT MODULE ***************

module.exports = {
  UserIsExist,
  NormalizeRole,
  IsRemovableRole,
  UserHasRole,
  HashPassword,
  ValidateUserCreateInput,
  ValidateUserUpdateInput,
  UserIsReferencedByStudent,
};
