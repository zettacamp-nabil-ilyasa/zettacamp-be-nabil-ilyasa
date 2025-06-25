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
 * Check if school long name and or brand name already exist
 * @param {longName} string - The school's long name to be checked
 * @param {brandName} string - The school's brand name to be checked
 * @param {schoolId} string - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 */
async function SchoolNameIsExist({ longName, brandName, schoolId = null }) {
  try {
    //*************** throw error if both longName and brandName are empty
    if (!longName && !brandName) {
      throw new ApolloError('at least one of long name or brand name is required');
    }
    //*************** set base query object
    const query = { status: 'active' };

    //*************** set query with or if both longName and brandName are not empty
    if (longName && brandName) {
      query.$or = [{ long_name: longName }, { brand_name: brandName }];

      //*************** set query with longName if only longName is not empty
    } else if (longName) {
      query.long_name = longName;

      //*************** set query with brandName if only brandName is not empty
    } else if (brandName) {
      query.brand_name = brandName;
    }
    //*************** add _id to query if schoolId is provided
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
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ longName, brandName, schoolId }),
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

    //*************** set query for db operation, cast string schoolId to ObjectId (mongoDB doesn't auto cast field besides _id)
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
  SchoolNameIsExist,
  SchoolIsReferencedByStudent,
};
