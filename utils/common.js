// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const ErrorLogModel = require('../graphql/errorLog/error_log.model.js');

/**
 * Convert a date string in "DD-MM-YYYY" format to a JavaScript Date object.
 * @param {string} dateStr - The date string to be parsed.
 * @returns {Date|undefined} - The corresponding Date object, or undefined if input is empty.
 * @throws {ApolloError} - If the date is invalid or the date is in the future.
 */
function ConvertStringToDate(dateStr) {
  // *************** date input check, return undefined to escape mongo date cast error
  if (!dateStr) {
    return undefined;
  }

  // *************** split to get day, month and year
  const [day, month, year] = dateStr.split('-');
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    throw new ApolloError('Invalid date format');
  }
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  // *************** check if date is an invalid date
  if (isNaN(birthDate.getTime())) {
    throw new ApolloError('Invalid date format');
  }

  // *************** check if date is in the future
  if (birthDate > today) {
    throw new ApolloError('Date of birth cannot be in the future');
  }

  return birthDate;
}

/**
 * Check if a school with the given ID exists and is active.
 * @param {string} schoolId - The ID of the school to check.
 * @returns {Promise<boolean>} - True if the school exists, false otherwise.
 * @throws {ApolloError} - If validation fails or database operation errors occur.
 */
async function SchoolIsExist(schoolId) {
  try {
    // *************** validate schoolId
    ValidateId(schoolId);

    // *************** set query for db operation
    const query = { _id: schoolId, status: 'active' };

    const isSchoolExist = Boolean(await SchoolModel.exists(query));
    return isSchoolExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsExist',
      path: '/utils/common-validator.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if a user with the given ID has the "admin" role.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 * @throws {ApolloError} - If validation fails or database operation errors occur.
 */
async function UserIsAdmin(userId) {
  try {
    // *************** validate userId
    ValidateId(userId);

    // *************** set query for db operation
    const query = { _id: userId, roles: 'admin' };
    const isUserAdmin = Boolean(await UserModel.exists(query));
    return isUserAdmin;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserIsAdmin',
      path: '/utils/common-validator.js',
      parameter_input: JSON.stringify({ userId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ConvertStringToDate,
  SchoolIsExist,
  UserIsAdmin,
};
