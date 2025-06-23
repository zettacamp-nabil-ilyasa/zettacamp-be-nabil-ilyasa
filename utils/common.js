//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');
const bcrypt = require('bcrypt');

//*************** IMPORT MODULE ***************
const SchoolModel = require('../graphql/school/school.model.js');
const UserModel = require('../graphql/user/user.model.js');
const ErrorLogModel = require('../graphql/errorLog/error_log.model.js');

/**
 * Converts a string to title case.
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
    //*************** sanity check
    if (typeof schoolId !== 'string' || schoolId.trim() === '' || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new ApolloError('Invalid school id input');
    }

    const query = { _id: schoolId, status: 'active' };
    const count = await SchoolModel.countDocuments(query);
    return count > 0;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { schoolId } });

    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} password - Plaintext to be hashed.
 * @returns string - Hashed password.
 * @throws {Error} - If failed sanity check or hashing process.
 */
async function HashPassword(password) {
  try {
    //*************** password input check
    if (typeof password !== 'string') {
      throw new ApolloError('Invalid password input');
    }
    const trimmedPassword = password.trim();
    if (trimmedPassword === '') {
      throw new ApolloError('Invalid password input');
    }

    const saltRounds = 10;

    //*************** hash password using bcrypt
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { password } });

    throw new ApolloError(error.message);
  }
}

/**
 *
 * @param {string} dateStr - The date string to be parsed.
 * @returns {Date} - The parsed date.
 */
function ParseDateDmy(dateStr) {
  if (!dateStr) {
    return null;
  }
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

/**
 * Custom stringify function that handles errors gracefully.
 * @param {object} obj - The object to be stringified.
 * @returns {string} - The stringified object.
 */
function SafeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return '[Error occured while stringifying object]';
  }
}

/**
 * Logs an error to the database.
 * @param {object} error - The error object.
 * @param {object} input - The input object.
 */
async function LogErrorToDb({ error, parameterInput }) {
  //*************** compose error log
  const errorLog = {
    error_name: error.name,
    error_stack: error.stack,
    parameter_input: SafeStringify(parameterInput),
  };
  try {
    //*************** save error log to db
    await ErrorLogModel.create(errorLog);
  } catch (loggingError) {
    throw new ApolloError(loggingError.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ToTitleCase,
  SchoolIsExist,
  HashPassword,
  FormatDateToIsoString,
  ParseDateDmy,
  SafeStringify,
  LogErrorToDb,
};
