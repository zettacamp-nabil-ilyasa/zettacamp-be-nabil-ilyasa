//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const StudentModel = require('../student/student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

//*************** IMPORT UTIL ***************
const { ValidateId } = require('../../utils/common-validator.js');

/**
 * Check if school long name already exist
 * @param {string} longName - The school's long name to be checked
 * @param {string} schoolId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in validation or db operation.
 */
async function SchoolLongNameIsExist({ longName, schoolId = null }) {
  try {
    //*************** validate longName input
    if (!longName) {
      throw new ApolloError('long name can not be empty or null');
    }

    //*************** schoolId input check
    if (schoolId) {
      ValidateId(schoolId);
    }

    //*************** set query for db operation
    const query = { long_name: longName };
    if (schoolId) {
      query._id = { $ne: schoolId };
    }

    const isLongNameExist = Boolean(await SchoolModel.exists(query));
    return isLongNameExist;
  } catch (error) {
    //*************** save error log to db
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolLongNameIsExist',
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ longName, schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if school brand name already exist
 * @param {string} brandName - The school's brand name to be checked
 * @param {string} _id - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in validation or db operation.
 */
async function SchoolBrandNameIsExist({ brandName, schoolId = null }) {
  try {
    //*************** validate brandName input
    if (!brandName) {
      throw new ApolloError('brand name can not be empty or null');
    }

    //*************** _id input check
    if (schoolId) {
      ValidateId(schoolId);
    }

    //*************** set query for db operation
    const query = { brand_name: brandName };
    if (schoolId) {
      query._id = { $ne: schoolId };
    }

    const isBrandNameExist = Boolean(await SchoolModel.exists(query));
    return isBrandNameExist;
  } catch (error) {
    //*************** log error to db
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolBrandNameIsExist',
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ brandName, schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} schoolId - The id of the school to be checked
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in validation or db operation.
 */
async function SchoolIsReferencedByStudent(schoolId) {
  try {
    //*************** schoolId input check
    ValidateId(schoolId);

    //*************** set query for db operation
    const query = { school_id: new mongoose.Types.ObjectId(schoolId), status: 'active' };

    //*************** store db operation result as boolean
    const isReferenced = Boolean(await StudentModel.exists(query));
    return isReferenced;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsReferencedByStudent',
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  SchoolIsReferencedByStudent,
};
