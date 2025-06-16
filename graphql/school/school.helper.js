//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const School = require('./school.model');

//*************** IMPORT UTILS ***************
const { ToTitleCase } = require('../../utils/common.js');

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
    //*************** sanity check
    if (typeof longName !== 'string' || longName.trim() === '') {
      throw new Error('Invalid long name input');
    }
    let trimmedID = '';
    if (excludeId) {
      if (typeof excludeId !== 'string' || excludeId.trim() === '' || !mongoose.Types.ObjectId.isValid(excludeId.trim())) {
        throw new Error('Invalid school id input');
      }
      trimmedExcludeId = excludeId.trim();
    }

    //*************** set query for db operation
    const trimmedLongName = longName.trim();
    const query = { long_name: trimmedLongName };
    if (excludeId) {
      query._id = { $ne: trimmedExcludeId };
    }

    const count = await School.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
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
    //*************** sanity check
    if (typeof brandName !== 'string' || brandName.trim() === '') {
      throw new Error('Invalid brand name input');
    }
    if (excludeId) {
      let trimmedId = '';
      if (typeof excludeId !== 'string' || trimmedID === '' || !mongoose.Types.ObjectId.isValid(excludeId.trim())) {
        throw new Error('Invalid school id input');
      }
      trimmedExcludeId = excludeId.trim();
    }

    //*************** set query for db operation
    const trimmedID = excludeId.trim();
    const trimmedBrandName = brandName.trim();
    const query = { brand_name: trimmedBrandName };
    if (excludeId) {
      query._id = { $ne: trimmedExcludeId };
    }

    const count = await School.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
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
    throw new Error('brand name contains invalid characters');
  }
  if (!schoolNameRegexPattern.test(long_name)) {
    throw new Error('long name contains invalid characters');
  }
  if (!addressRegexPattern.test(address)) {
    throw new Error('address contains invalid characters');
  }
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

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new Error('invalid school id');
  }
  if (brand_name && !schoolNameRegexPattern.test(brand_name)) {
    throw new Error('brand name contains invalid characters');
  }
  if (long_name) {
    if (!schoolNameRegexPattern.test(long_name)) {
      throw new Error('long name contains invalid characters');
    }
    long_name = ToTitleCase(long_name);
  }
  if (address && !addressRegexPattern.test(address)) {
    throw new Error('address contains invalid characters');
  }

  const validatedInput = { _id, brand_name, long_name, address };
  return validatedInput;
}

// *************** EXPORT MODULE ***************
module.exports = {
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  ValidateSchoolCreateInput,
  ValidateSchoolUpdateInput,
};
