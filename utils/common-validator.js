const { ApolloError } = require('apollo-server-express');

//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const UserModel = require('../graphql/user/user.model.js');
const SchoolModel = require('../graphql/school/school.model.js');
const ErrorLogModel = require('../graphql/errorLog/error_log.model.js');

/**
 * Check if id is not empty and in valid format.
 * @param {string} id - id to be checked.
 * @throws {Error} - If failed in validation.
 */
function ValidateId(id) {
  if (!id) {
    throw new ApolloError('ID is required');
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApolloError('Invalid ID format');
  }
}

/**
 * Check if a School with the given ID already exists.
 * @param {string} schoolId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolIsExist(schoolId) {
  try {
    //*************** validate schoolId
    ValidateId(schoolId);

    //*************** set query for db operation
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
 * Checks if a user is exist and has admin role.
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<boolean>} - True if user has admin role, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserIsAdmin(userId) {
  try {
    //*************** validate userId
    ValidateId(userId);

    //*************** set query for db operation
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

//*************** EXPORT MODULE ***************
module.exports = {
  ValidateId,
  SchoolIsExist,
  UserIsAdmin,
};
