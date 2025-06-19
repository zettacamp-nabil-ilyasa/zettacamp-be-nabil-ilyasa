//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const StudentModel = require('../student/student.model.js');

//*************** IMPORT UTILS ***************
const { ToTitleCase } = require('../../utils/common.js');
const { SanitizeAndValidateId } = require('../../utils/common-validator.js');

//*************** regex pattern to ensure school name only have letters and numbers
const schoolNameRegexPattern = /^[a-zA-Z\s'-\d]+$/;

//*************** regex pattern to ensure address is at least 5 characters
const addressRegexPattern = /^[a-zA-Z0-9\s,'./\-#()]{10,50}$/;

/**
 * Check if school name already exist
 * @param {string} longName - The school's long name to be checked
 * @param {string} excludeId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolLongNameIsExist(longName, excludeId = null) {
  try {
    //*************** longName input check
    if (typeof longName !== 'string') {
      throw new ApolloError('Invalid long name input');
    }
    const trimmedLongName = longName.trim();
    if (trimmedLongName === '') {
      throw new ApolloError('Invalid long name input');
    }
    //*************** excludeId input check
    let validatedExcludeId = '';
    if (excludeId) {
      validatedExcludeId = SanitizeAndValidateId(excludeId);
    }

    //*************** set query for db operation
    const query = { long_name: trimmedLongName };
    if (excludeId) {
      query._id = { $ne: validatedExcludeId };
    }

    const count = await SchoolModel.countDocuments(query);
    return count > 0;
  } catch (error) {
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
    //*************** brandName input check
    if (typeof brandName !== 'string') {
      throw new ApolloError('Invalid brand name input');
    }
    const trimmedBrandName = brandName.trim();
    if (trimmedBrandName === '') {
      throw new ApolloError('Invalid brand name input');
    }

    //*************** excludeId input check
    let validatedExcludeId = '';
    if (excludeId) {
      validatedExcludeId = SanitizeAndValidateId(excludeId);
    }

    //*************** set query for db operation
    const query = { brand_name: trimmedBrandName };
    if (excludeId) {
      query._id = { $ne: validatedExcludeId };
    }

    const count = await SchoolModel.countDocuments(query);
    return count > 0;
  } catch (error) {
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
    const validatedSchoolId = SanitizeAndValidateId(schoolId);

    //*************** set query for db operation
    const query = { school_id: new mongoose.Types.ObjectId(validatedSchoolId), status: 'active' };

    //*************** store db operation result as boolean
    const referenceIsExist = Boolean(await StudentModel.exists(query));
    return referenceIsExist;
  } catch (error) {
    throw new ApolloError(error.message);
  }
}

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateSchoolCreateInput(input) {
  let { brand_name, long_name, address } = input;
  if (!schoolNameRegexPattern.test(brand_name)) {
    throw new ApolloError('brand name contains invalid characters');
  }
  if (!schoolNameRegexPattern.test(long_name)) {
    throw new ApolloError('long name contains invalid characters');
  }
  if (!addressRegexPattern.test(address)) {
    throw new ApolloError('address contains invalid characters');
  }
  //*************** format long name using Title case
  long_name = ToTitleCase(long_name);

  const validatedInput = { brand_name, long_name, address };
  return validatedInput;
}

/**
 * Validates school update input.
 * @param {object} input - The input object containing updated school data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateSchoolUpdateInput(input) {
  let { _id, brand_name, long_name, address } = input;
  //*************** _id input check
  _id = SanitizeAndValidateId(_id);

  if (brand_name && !schoolNameRegexPattern.test(brand_name)) {
    throw new ApolloError('brand name contains invalid characters');
  }
  if (long_name) {
    if (!schoolNameRegexPattern.test(long_name)) {
      throw new ApolloError('long name contains invalid characters');
    }
    //*************** format long name using Title case
    long_name = ToTitleCase(long_name);
  }
  if (address && !addressRegexPattern.test(address)) {
    throw new ApolloError('address contains invalid characters');
  }

  const validatedInput = { _id, brand_name, long_name, address };
  return validatedInput;
}

// *************** EXPORT MODULE ***************
module.exports = {
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  SchoolIsReferencedByStudent,
  ValidateSchoolCreateInput,
  ValidateSchoolUpdateInput,
};
