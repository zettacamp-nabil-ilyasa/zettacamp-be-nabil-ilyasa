// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

/**
 * Validates the user input object for CreateUser.
 * @param {Object} input - The input object containing user data.
 * @param {string} input.first_name - The user's first name.
 * @param {string} input.last_name - The user's last name.
 * @param {string} input.email - The user's email address.
 * @param {string} input.role - Role assigned to the user.
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateCreateUserInput(input) {
  // *************** destructured input object
  let { first_name, last_name, email } = input;

  // *************** validate user's email
  const userEmailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || email.trim() === '' || !userEmailRegexPattern.test(email))
    throw new ApolloError('email is required and must be in valid email format');

  // *************** validate user's first_name
  if (!first_name || typeof first_name !== 'string') throw new ApolloError('first_name is required');

  // *************** validate user's last_name
  if (!last_name || typeof last_name !== 'string') throw new ApolloError('last_name is required');
}

/**
 * Validates the user input object for UpdateUser.
 * @param {Object} input - The input object containing user data.
 * @param {string} input.first_name - The user's first name.
 * @param {string} input.last_name - The user's last name.
 * @param {string} input.email - The user's email address.
 * @param {string} input.password - The user's updated password.
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateUpdateUserInput(input) {
  // *************** destructured input object
  let { first_name, last_name, email, password } = input;

  // *************** validate user's email
  const userEmailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') throw new ApolloError('email is required and must be a string');
  if (!userEmailRegexPattern.test(email)) throw new ApolloError('email must be in valid format');

  // *************** validate user's first_name
  if (!first_name || typeof first_name !== 'string') throw new ApolloError('first_name is required and must be a string');

  // *************** validate user's last_name
  if (!last_name || typeof last_name !== 'string') throw new ApolloError('last_name is required and must be a string');

  // *************** validate user's password
  const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
  if (!password || typeof password !== 'string') throw new ApolloError('password is required and must be a string');
  if (!passwordRegexPattern.test(password))
    throw new ApolloError('password must have min of 8 characters, contain min of 1 number, 1 uppercase letter, and 1 lowercase letter');
}

/**
 * Validates the user input object for required fields.
 * @param {Object} input - The input object containing data for user login.
 * @param {String} input.email - The user's email.
 * @param {String} input.password - The user's password.
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateLoginInput(input) {
  // *************** validate email provided in input
  if (!input.email || !typeof input.email !== 'string') throw new ApolloError('email is required and must be a string');

  // *************** validate password provided in input
  if (!input.password || !typeof input.password !== 'string') throw new ApolloError('password is required and must be a string');
}

/**
 * Check if a user email already exists in the database.
 * @async
 * @param {string} userEmail - The email to check.
 * @throws {ApolloError} - If input is invalid or DB query fails.
 */
async function ValidateUniqueUserEmail(userEmail) {
  try {
    // *************** check if email is empty
    if (!userEmail) {
      throw new ApolloError('user email is required');
    }

    // *************** set base query for db operation
    const emailIsExist = await UserModel.findOne({ email: userEmail.trim().toLowerCase() }).lean();

    // *************** throw error if email is already exist
    if (emailIsExist) {
      throw new ApolloError('email already used by another user');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'ValidateUniqueUserEmail',
      path: '/modules/user/user.validators.js',
      parameter_input: JSON.stringify({ userEmail }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateCreateUserInput, ValidateUpdateUserInput, ValidateUniqueUserEmail, ValidateLoginInput };
