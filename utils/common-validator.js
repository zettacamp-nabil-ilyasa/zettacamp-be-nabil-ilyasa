const { ApolloError } = require('apollo-server');

//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const UserModel = require('../graphql/user/user.model.js');
const ErrorLogModel = require('../graphql/errorLog/error_log.model.js');

//*************** IMPORT UTIL ***************
const { LogErrorToDb } = require('./common.js');

/**
 * Check if id is in valid format.
 * @param {string} id - id to be checked.
 * @returns {string} - Trimmed and validated object id.
 * @throws {Error} - If failed in sanity check.
 */
function SanitizeAndValidateId(id) {
  //*************** check if id is not a string
  if (typeof id !== 'string') {
    throw new ApolloError('Invalid id input');
  }
  const trimmedId = id.trim();
  //*************** check if id is empty and not an object id
  if (trimmedId === '' || !mongoose.Types.ObjectId.isValid(trimmedId)) {
    throw new ApolloError('Invalid id input');
  }
  return trimmedId;
}

/**
 * Trim and validate string, throws error if it's not string or empty
 * @param {string} str - string to be checked
 * @returns {string} - trimmed and validated string
 * @throws {Error} - If failed in sanity check
 */
function SanitizeAndValidateRequiredString(str) {
  if (typeof str !== 'string') {
    throw new ApolloError('Expected string input');
  }
  const trimmedStr = str.trim();
  if (trimmedStr === '') {
    throw new ApolloError('String input cannot be empty');
  }
  return trimmedStr;
}

/**
 * Trim and validate string, allows empty string
 * @param {string} str - string to be checked
 * @returns {string} - trimmed and validated string
 */
function SanitizeAndValidateOptionalString(str) {
  if (typeof str !== 'string') {
    throw new ApolloError('Expected string input');
  }
  const trimmedStr = str.trim();
  if (trimmedStr === '') {
    return '';
  }
  return trimmedStr;
}

/**
 * Checks if a user is exist and has admin role.
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<boolean>} - True if user has admin role, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserIsAdmin(userId) {
  try {
    //*************** userId input check
    const validatedUserId = SanitizeAndValidateId(userId);
    //*************** set query for db operation
    const query = { _id: validatedUserId, roles: 'admin' };
    const count = await UserModel.countDocuments(query);
    const userIsAdmin = count > 0;
    return userIsAdmin;
  } catch (error) {
    try {
      await ErrorLogModel.create({
        error_stack: error.stack,
        function_name: 'UserIsAdmin',
        path: 'D:/Zettacamp/Zettacamp BE/zettacamp-be-nabil-ilyasa/utils/common-validator.js',
        parameter_input: JSON.stringify({ userId }),
      });
    } catch (loggingError) {
      throw new ApolloError(loggingError.message);
    }
    throw new ApolloError(error.message);
  }
}

//*************** EXPORT MODULE ***************
module.exports = {
  SanitizeAndValidateId,
  SanitizeAndValidateRequiredString,
  SanitizeAndValidateOptionalString,
  UserIsAdmin,
};
