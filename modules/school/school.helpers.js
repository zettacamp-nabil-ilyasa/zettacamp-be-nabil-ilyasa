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
      path: '/modules/school/school.helpers.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

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
    // *************** add _id to query if schoolId is provided
    if (schoolId) {
      ValidateId(schoolId);
      query._id = { $ne: schoolId };
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

/**
 * Check if a school is referenced by any student.
 * @async
 * @param {string} schoolId - The ID of the school to check.
 * @returns {Promise<boolean>} - Returns true if at least one student references the school.
 * @throws {ApolloError} - If input validation or DB operation fails.
 */
async function SchoolIsReferencedByStudent(schoolId) {
  try {
    // *************** schoolId input check
    ValidateId(schoolId);

    // *************** set query for db operation, cast string schoolId to ObjectId (mongoDB doesn't auto cast field besides _id)
    const query = { school_id: new mongoose.Types.ObjectId(schoolId), status: 'active' };

    // *************** store db operation result as boolean
    const isReferenced = Boolean(await StudentModel.exists(query));
    return isReferenced;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsReferencedByStudent',
      path: '/modules/school/school.helpers.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  SchoolIsExist,
  SchoolNameIsExist,
  SchoolIsReferencedByStudent,
};
