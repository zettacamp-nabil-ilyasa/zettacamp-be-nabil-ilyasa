//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const StudentModel = require('../student/student.model.js');

//*************** IMPORT UTILS ***************
const { SanitizeAndValidateId, SanitizeAndValidateOptionalString } = require('../../utils/common-validator.js');
const { LogErrorToDb } = require('../../utils/common.js');

/**
 * Check if school name already exist
 * @param {string} longName - The school's long name to be checked
 * @param {string} excludeId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolLongNameIsExist(longName, excludeId = null) {
  try {
    //*************** validate longName input
    const validLongName = SanitizeAndValidateOptionalString(longName);

    //*************** excludeId input check
    let validExcludeId = '';
    if (excludeId) {
      validExcludeId = SanitizeAndValidateId(excludeId);
    }

    //*************** set query for db operation
    const query = { long_name: validLongName };
    if (excludeId) {
      query._id = { $ne: validExcludeId };
    }

    const count = await SchoolModel.countDocuments(query);
    return count > 0;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { longName, excludeId } });

    throw new ApolloError(error.message);
  }
}

/**
 * Check if school name already exist
 * @param {string} brandName - The school's brand name to be checked
 * @param {string} excludeId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolBrandNameIsExist(brandName, excludeId = null) {
  try {
    //*************** validate brandName input
    const validBrandName = SanitizeAndValidateOptionalString(brandName);
    if (validBrandName === '') {
      throw new ApolloError('Invalid brand name input');
    }

    //*************** excludeId input check
    let validExcludeId = '';
    if (excludeId) {
      validExcludeId = SanitizeAndValidateId(excludeId);
    }

    //*************** set query for db operation
    const query = { brand_name: validBrandName };
    if (excludeId) {
      query._id = { $ne: validExcludeId };
    }

    const count = await SchoolModel.countDocuments(query);
    return count > 0;
  } catch (error) {
    //*************** log error to db
    await LogErrorToDb({ error, parameterInput: { brandName, excludeId } });

    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} schoolId - The id of the school to be checked
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolIsReferencedByStudent(schoolId) {
  try {
    //*************** schoolId input check
    const validSchoolId = SanitizeAndValidateId(schoolId);

    //*************** set query for db operation
    const query = { school_id: new mongoose.Types.ObjectId(validSchoolId), status: 'active' };

    //*************** store db operation result as boolean
    const referenceIsExist = Boolean(await StudentModel.exists(query));
    return referenceIsExist;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { schoolId } });

    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  SchoolIsReferencedByStudent,
};
