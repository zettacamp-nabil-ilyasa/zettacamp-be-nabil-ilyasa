// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const StudentModel = require('../student/student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTIL ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

/**
 * Check if a school's long name and/or brand name already exists in the database
 * @async
 * @param {object} params - Input parameters.
 * @param {string} params.longName - The school's long name to be checked.
 * @param {string} params.brandName - The school's brand name to be checked.
 * @param {string} [params.schoolId] - ID of the school to exclude from the check (optional).
 * @returns {Promise<boolean>} - Returns true if a school with the same name exists, otherwise false.
 * @throws {ApolloError} - If both names are missing, invalid ID, or DB operation fails.
 */
async function SchoolNameIsExist({ longName, brandName, schoolId }) {
  try {
    // *************** throw error if both longName and brandName are empty
    if (!longName && !brandName) {
      throw new ApolloError('at least one of long name or brand name is required');
    }
    // *************** set base query object
    const query = { status: 'active' };

    // *************** add _id to query if schoolId is provided
    if (schoolId) {
      ValidateId(schoolId);
      query._id = { $ne: schoolId };
    }

    // *************** set query with or if both longName and brandName are not empty
    if (longName && brandName) {
      query.$or = [{ long_name: longName }, { brand_name: brandName }];

      // *************** set query with longName if only longName is not empty
    } else if (longName) {
      query.long_name = longName;

      // *************** set query with brandName if only brandName is not empty
    } else if (brandName) {
      query.brand_name = brandName;
    }
    const isExist = Boolean(await SchoolModel.exists(query));
    return isExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolNameIsExist',
      path: '/modules/school/school.helpers.js',
      parameter_input: JSON.stringify({ longName, brandName, schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  SchoolNameIsExist,
};
