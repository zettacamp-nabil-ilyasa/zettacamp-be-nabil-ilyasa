// *************** IMPORT LIBRARY ***************
const SchoolModel = require('../../modules/school/school.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateId } = require('../common-validator/mongo-validator.js');

/**
 * Check if a school with the given ID exists and is active.
 * @param {string} schoolId - The ID of the school to check.
 * @returns {Promise<boolean>} - True if the school exists, false otherwise.
 * @throws {ApolloError} - If validation fails or database operation errors occur.
 */
async function SchoolIsExist(schoolId) {
  try {
    // *************** validate School's id
    ValidateId(schoolId);

    // *************** set query for db operation
    const query = { _id: schoolId, status: 'active' };

    const isSchoolExist = SchoolModel.findOne(query);
    return isSchoolExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsExist',
      path: '/utilities/validators/school.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { SchoolIsExist };
