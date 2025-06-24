//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');
const bcrypt = require('bcrypt');

//*************** IMPORT MODULE ***************
const SchoolModel = require('../graphql/school/school.model.js');
const ErrorLogModel = require('../graphql/errorLog/error_log.model.js');

//*************** IMPORT UTIL ***************
const { ValidateId } = require('./common-validator.js');

/**
 * Converts a string to title case.
 * Used for input validation.
 * @param {string} string - The string to convert.
 * @returns {string} - The converted string in title case.
 * @throws {Error} - If failed in sanity check.
 */
function ToTitleCase(string) {
  //*************** sanity check
  if (typeof string !== 'string') {
    throw new ApolloError('Invalid string input');
  }
  const lowercase = string.trim().toLowerCase();
  if (lowercase === '') {
    throw new ApolloError('Invalid string input');
  }
  const splittedString = lowercase.split(' ');
  const titledCase = splittedString.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return titledCase;
}

/**
 * Converts a date to ISO date string.
 * Used for date field display.
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

  const day = parsedDate.getDate().toString().padStart(2, '0');
  const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
  const year = parsedDate.getFullYear().toString().padStart(4, '0');

  return `${day}-${month}-${year}`;
}

/**
 * Check if a School with the given ID already exists.
 * @param {string} schoolId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function SchoolIsExist(schoolId) {
  try {
    //*************** validate schoolId input
    ValidateId(schoolId);

    const query = { _id: schoolId, status: 'active' };
    const isSchoolExist = Boolean(await SchoolModel.exists(query));
    return isSchoolExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SchoolIsExist',
      path: '/utils/common.js',
      parameter_input: JSON.stringify({ schoolId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} password - Plaintext to be hashed.
 * @returns string - Hashed password.
 * @throws {Error} - If failed sanity check or hashing process.
 */
async function HashPassword(password) {
  try {
    //*************** password input check
    if (!password) {
      throw new ApolloError('Invalid password input');
    }
    if (typeof password !== 'string') {
      throw new ApolloError('Invalid password input');
    }
    const trimmedPassword = password.trim();
    const saltRounds = 10;

    //*************** hash password using bcrypt
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'HashPassword',
      path: '/utils/common.js',
      parameter_input: JSON.stringify({ password }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Parses a date string in DD-MM-YYYY format to a Date object.
 * Used for date input validation.
 * @param {string} dateStr - The date string to be parsed.
 * @returns {Date} - The parsed date.
 */
function ParseDateDmy(dateStr) {
  if (typeof dateStr !== 'string') {
    throw new ApolloError('Invalid date input');
  }
  if (dateStr.trim() === '') {
    return null;
  }
  //*************** split to get day, month and year
  const [day, month, year] = dateStr.split('-');
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    throw new ApolloError('Invalid date format');
  }
  return new Date(year, month - 1, day);
}

// *************** EXPORT MODULE ***************
module.exports = {
  ToTitleCase,
  SchoolIsExist,
  HashPassword,
  FormatDateToIsoString,
  ParseDateDmy,
};
