// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validates the user input object for required fields.
 * Set the checkUserId to true to validate input for update mutation
 * @param {Object} input - The input object containing user data.
 * @param {string} input.first_name - The user's first name.
 * @param {string} input.last_name - The user's last name.
 * @param {string} input.email - The user's email address.
 * @param {string} input.role - Role assigned to the user.
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateUserInput(input, { checkUserId, userId }) {
  // *************** if checkUserId set to true, validate userId (for update mutation purpose)
  if (checkUserId) {
    ValidateId(userId);
  }

  // *************** destructured input object
  let { first_name, last_name, email, role } = input;

  // *************** validate user's email
  const userEmailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || email.trim() === '' || !userEmailRegexPattern.test(email))
    throw new ApolloError('email is required and must be in valid email format');

  // *************** validate user's first_name
  if (typeof first_name !== 'string' || first_name.trim() === '') throw new ApolloError('first_name is required');

  // *************** validate user's last_name
  if (typeof last_name !== 'string' || last_name.trim() === '') throw new ApolloError('last_name is required');

  // *************** validate user's role
  const validRoles = ['admin', 'operator'];
  if (typeof role !== 'string' || !validRoles.includes(role))
    throw new ApolloError(`role is required and should be one of: ${validRoles.join(', ')}`);
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
module.exports = { ValidateUserInput, ValidateUniqueUserEmail };
