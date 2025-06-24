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
 * Check if school name already exist
 * @param {string} long_name - The school's long name to be checked
 * @param {string} _id - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolLongNameIsExist({ long_name, _id = null }) {
  try {
    //*************** validate long_name input
    if (!long_name) {
      throw new ApolloError('long name can not be empty or null');
    }

    //*************** _id input check
    if (_id) {
      ValidateId(_id);
    }

    //*************** set query for db operation
    const query = { long_name };
    if (_id) {
      query._id = { $ne: _id };
    }

    const longNameIsExist = Boolean(await SchoolModel.exists(query));
    return longNameIsExist;
  } catch (error) {
    //*************** save error log to db
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolLongNameIsExist',
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ long_name, _id }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if school name already exist
 * @param {string} brand_name - The school's brand name to be checked
 * @param {string} _id - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolBrandNameIsExist({ brand_name, _id = null }) {
  try {
    //*************** validate brandName input
    if (!brand_name) {
      throw new ApolloError('brand name can not be empty or null');
    }

    //*************** _id input check
    if (_id) {
      ValidateId(_id);
    }

    //*************** set query for db operation
    const query = { brand_name };
    if (_id) {
      query._id = { $ne: _id };
    }

    const brandNameIsExist = Boolean(await SchoolModel.exists(query));
    return brandNameIsExist;
  } catch (error) {
    //*************** log error to db
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolBrandNameIsExist',
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ brand_name, _id }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} school_id - The id of the school to be checked
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolIsReferencedByStudent(school_id) {
  try {
    //*************** school_id input check
    ValidateId(school_id);

    //*************** set query for db operation
    const query = { school_id: new mongoose.Types.ObjectId(school_id), status: 'active' };

    //*************** store db operation result as boolean
    const referenceIsExist = Boolean(await StudentModel.exists(query));
    return referenceIsExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsReferencedByStudent',
      path: '/graphql/school/school.helpers.js',
      parameter_input: JSON.stringify({ school_id }),
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
