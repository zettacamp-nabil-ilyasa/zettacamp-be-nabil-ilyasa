//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const Student = require('./student.model');

//*************** IMPORT UTILS ***************
const { ToTitleCase } = require('../../utils/common.js');

//*************** regex pattern to ensure email is includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/;

//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//*************** regex pattern to ensure first and last name contains only letters
const firstAndLastNameRegexPattern = /^[a-zA-Z\s'-]+$/;

//*************** regex pattern to ensure date is in YYYY-MM-DD format
const dateRegexPattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 *
 * @param {string} dateString - The date to be validated.
 * @returns {Date} - Validated date.
 * @throws {Error} - If validation fails.
 */
function ValidateDateOfBirth(dateString) {
  //*************** check if date of birth is comply with date format
  if (typeof dateString === 'string' && !dateRegexPattern.test(dateStr)) {
    throw new Error('date of birth format must be in YYYY-MM-DD format');
  }
  const birthDate = new Date(dateString);
  const today = new Date();

  //*************** check if birth date is a future date
  if (isNaN(birthDate.getTime()) || birthDate > today) {
    throw new Error('invalid date of birth value');
  }
  return birthDate;
}

/**
 * Check if a Student with the given ID already exists.
 * @param {string} studentId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed sanity check or db operation.
 */
async function StudentIsExist(studentId) {
  try {
    //*************** sanity check
    if (typeof studentId !== 'string' || studentId.trim() === '' || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student id input');
    }

    const trimmedId = studentId.trim();
    const query = { _id: trimmedId, status: 'active' };
    const count = await Student.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if student email already exist
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function StudentEmailIsExist(emailAcc, excludeId = null) {
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
    const trimmedEmail = emailAcc.trim();
    const query = { email: trimmedEmail };
    if (excludeId) {
      query._id = { $ne: trimmedExcludeId };
    }

    const count = await Student.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Validates student creation input.
 * @param {object} input - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentCreateInput(input) {
  let { first_name, last_name, email, date_of_birth, school_id } = input;

  if (!emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  date_of_birth = ValidateDateOfBirth(date_of_birth);
  first_name = ToTitleCase(first_name);
  last_name = ToTitleCase(last_name);

  const validatedInput = { first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

/**
 * Validates input for creating both a user and a student.
 * @param {object} input - The combined input object.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentAndUserCreateInput(input) {
  let { first_name, last_name, email, password, date_of_birth, school_id } = input;

  if (!emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (!passwordRegexPattern.test(password)) {
    throw new Error(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  date_of_birth = ValidateDateOfBirth(date_of_birth);
  first_name = ToTitleCase(first_name);
  last_name = ToTitleCase(last_name);

  const validatedInput = { first_name, last_name, email, password, date_of_birth, school_id };
  return validatedInput;
}

/**
 * Validates student update input.
 * @param {object} input - The input object containing updated student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentUpdateInput(input) {
  let { _id, first_name, last_name, email, date_of_birth, school_id } = input;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new Error('invalid student id');
  }
  if (email && !emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (first_name) {
    if (!firstAndLastNameRegexPattern.test(first_name)) {
      throw new Error('first name contains invalid characters');
    }
    first_name = ToTitleCase(first_name);
  }
  if (last_name) {
    if (!firstAndLastNameRegexPattern.test(last_name)) {
      throw new Error('last name contains invalid characters');
    }
    last_name = ToTitleCase(last_name);
  }
  if (school_id && !mongoose.Types.ObjectId.isValid(school_id)) {
    throw new Error('invalid school id');
  }

  date_of_birth = ValidateDateOfBirth(date_of_birth);
  const validatedInput = { _id, first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

// *************** EXPORT MODULE ***************

module.exports = {
  StudentIsExist,
  StudentEmailIsExist,
  ValidateStudentCreateInput,
  ValidateStudentAndUserCreateInput,
  ValidateStudentUpdateInput,
};
