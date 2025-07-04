// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const SchoolModel = require('../../modules/school/school.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateId } = require('./mongo-validator.js');

/**
 * Check if a school with the given ID exists and is active.
 * @param {string} schoolId - The ID of the school to check.
 * @returns {Promise<Object|null>} - The School object if found, otherwise null.
 * @throws {ApolloError} - If validation fails or database operation errors occur.
 */
async function ValidateSchoolExistence(schoolId) {
  try {
    // *************** validate School's id
    ValidateId(schoolId);

    // *************** set query for db operation
    const query = { _id: schoolId, status: 'active' };

    const schoolIsExist = SchoolModel.findOne(query).lean();
    if (!schoolIsExist) {
      throw new ApolloError("School doesn't exist");
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsExist',
      path: '/utilities/validators/school-validator.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateSchoolExistence };
