// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

/**
 * Validates the user input object for required fields.
 * @param {Object} inputObject - The input object containing user data.
 * @param {string} inputObject.first_name - The user's first name.
 * @param {string} inputObject.last_name - The user's last name.
 * @param {string} inputObject.email - The user's email address.
 * @param {string} inputObject.role - Role assigned to the user.
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateUserInput(inputObject) {
  // *************** destructured input object
  let { first_name, last_name, email, role } = inputObject;

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
    throw new ApolloError('role is required and should be one of: ' + validRoles.join(', '));
}

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
    const userIsExist = await UserModel.findOne(query);
    return userIsExist;
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
      throw new ApolloError('user email is required');
    }

    // *************** set base query for db operation
    const query = { email: userEmail };

    // *************** set query for User's id
    if (userId) {
      ValidateId(userId);
      query._id = { $ne: userId };
    }

    const emailIsExist = await UserModel.findOne(query);
    return emailIsExist;
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

// *************** EXPORT MODULE ***************
module.exports = { ValidateUserInput, UserIsExist, UserEmailIsExist };
