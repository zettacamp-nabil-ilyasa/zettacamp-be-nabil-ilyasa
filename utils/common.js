//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const SchoolModel = require('../graphql/school/school.model.js');
const UserModel = require('../graphql/user/user.model.js');

//*************** list of non-mandatory fields
const nonMandatoryFields = ['address', 'date_of_birth'];

/**
 * Cleans input from null, undefined, and empty string values (shallow only).
 * @param {Object} input - Input object to be cleaned.
 * @returns {Object} cleanedInput - Cleaned input object.
 */
function CleanNonRequiredInput(input) {
  //*************** sanity check
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new TypeError('Input should be an object');
  }
  const cleanedInput = {};
  for (const [key, value] of Object.entries(input)) {
    //*************** skip null, undefined
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      //*************** allow empty string for non-mandatory fields
      if (nonMandatoryFields.includes(key)) {
        cleanedInput[key] = trimmed;

        //*************** if it's not an empty string, assign the trimmed value
      } else if (trimmed !== '') {
        cleanedInput[key] = trimmed;
      }
    } else {
      cleanedInput[key] = value;
    }
  }
  return cleanedInput;
}

/**
 * Converts a string to title case.
 * @param {string} string - The string to convert.
 * @returns {string} - The converted string in title case.
 * @throws {Error} - If failed in sanity check.
 */
function ToTitleCase(string) {
  //*************** sanity check
  if (typeof string !== 'string') {
    throw new Error('Invalid string input');
  }
  const lowercase = string.trim().toLowerCase();
  if (lowercase === '') {
    throw new Error('Invalid string input');
  }
  const splittedString = lowercase.split(' ');
  const titledCase = splittedString.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return titledCase;
}

/**
 * Converts a date to ISO date string.
 * @param {Date} date - The date to convert.
 * @returns {string | null} - The converted date in ISO string format or null if date is invalid.
 */
function FormatDateToIsoString(date) {
  //*************** date input check
  if (!date) {
    return null;
  }

  //*************** set Date object using date
  const parsedDate = new Date(date);

  //*************** check if date is an invalid date
  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split('T')[0];
}

/**
 * Check if a School with the given ID already exists.
 * @param {string} schoolId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolIsExist(schoolId) {
  try {
    //*************** sanity check
    if (typeof schoolId !== 'string' || schoolId.trim() === '' || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new Error('Invalid school id input');
    }

    const query = { _id: schoolId, status: 'active' };
    const count = await SchoolModel.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if user email already exist
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserEmailIsExist(emailAcc, excludeId = null) {
  try {
    //*************** sanity check
    if (typeof emailAcc !== 'string' || emailAcc.trim() === '') {
      throw new Error('Invalid email input');
    }
    let trimmedExcludeId = '';
    if (excludeId) {
      if (typeof excludeId !== 'string' || excludeId.trim() === '' || !mongoose.Types.ObjectId.isValid(excludeId.trim())) {
        throw new Error('Invalid exclude id input');
      }
      trimmedExcludeId = excludeId.trim();
    }

    //*************** set query for db operation
    const query = { email: emailAcc };
    if (excludeId) {
      query._id = { $ne: trimmedExcludeId };
    }

    const count = await UserModel.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { CleanNonRequiredInput, ToTitleCase, SchoolIsExist, UserEmailIsExist, FormatDateToIsoString };
