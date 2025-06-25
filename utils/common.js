//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const bcrypt = require('bcrypt');

//*************** IMPORT MODULE ***************
const ErrorLogModel = require('../graphql/errorLog/error_log.model.js');

/**
 * Process date object for display.
 * @param {Date} date - The date to convert.
 * @returns {string | null} - The converted date in ISO string format or null if date is invalid.
 */
function FormatDateToDisplayString(date) {
  //*************** date input check
  if (!date) {
    return '';
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
 * Parses a string, then converts it to a Date object.
 * @param {string} dateStr - The date string to be parsed.
 * @returns {Date} - Date object from parsed date string, or undefined if it's an empty string
 */
function ConvertStringToDate(dateStr) {
  //*************** date input check
  if (!dateStr) {
    return undefined;
  }

  //*************** split to get day, month and year
  const [day, month, year] = dateStr.split('-');
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    throw new ApolloError('Invalid date format');
  }
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  //*************** check if date is an invalid date
  if (isNaN(birthDate.getTime())) {
    throw new ApolloError('Invalid date format');
  }

  //*************** check if date is in the future
  if (birthDate > today) {
    throw new ApolloError('Date of birth cannot be in the future');
  }

  return birthDate;
}

// *************** EXPORT MODULE ***************
module.exports = {
  HashPassword,
  FormatDateToDisplayString,
  ConvertStringToDate,
};
