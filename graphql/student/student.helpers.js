//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');

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
 * @param {string} dateInput - The date to be validated.
 * @returns {Date | null} - Validated date.
 * @throws {Error} - If validation fails.
 */
function ValidateDateOfBirth(dateInput) {
  let birthDate;
  //*************** dateInput check
  if (typeof dateInput !== 'string') {
    throw new Error('Invalid date input');
  }
  if (dateInput.trim() === '') {
    return null;
  }

  //*************** check with regex pattern to ensure date is in YYYY-MM-DD format
  if (!dateRegexPattern.test(dateInput)) {
    throw new Error('Invalid date format');
  }

  //*************** convert dateInput to Date object
  birthDate = new Date(dateInput);
  const today = new Date();

  //*************** check if date is an invalid date
  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid date format');
  }

  //*************** check if date is in the future
  if (birthDate > today) {
    throw new Error('Date of birth cannot be in the future');
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
    //*************** studentId input check
    if (typeof studentId !== 'string') {
      throw new Error('Invalid student id input');
    }
    const trimmedStudentId = studentId.trim();
    if (trimmedStudentId === '' || !mongoose.Types.ObjectId.isValid(trimmedStudentId)) {
      throw new Error('Invalid student id input');
    }

    //*************** set query for db operation
    const query = { _id: trimmedStudentId, status: 'active' };

    const count = await StudentModel.countDocuments(query);
    const studentIsExist = count > 0;
    return studentIsExist;
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
    //*************** emailAcc input check
    if (typeof emailAcc !== 'string') {
      throw new Error('Invalid email input');
    }
    const trimmedEmail = emailAcc.trim();
    if (trimmedEmail === '') {
      throw new Error('Invalid email input');
    }

    //*************** excludeId input check
    let trimmedExcludeId = '';
    if (excludeId) {
      if (typeof excludeId !== 'string') {
        throw new Error('Invalid exclude id input');
      }
      trimmedExcludeId = excludeId.trim();
      if (trimmedExcludeId === '' || !mongoose.Types.ObjectId.isValid(trimmedExcludeId)) {
        throw new Error('Invalid exclude id input');
      }
    }

    //*************** set query for db operation
    const query = { email: trimmedEmail };
    if (excludeId) {
      query._id = { $ne: trimmedExcludeId };
    }

    const count = await StudentModel.countDocuments(query);
    const studentEmailIsExist = count > 0;
    return studentEmailIsExist;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 *
 * @param {string} studentId - The id of the user to be checked.
 * @returns {promise<string>} - The referenced user id.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function GetReferencedUserId(studentId) {
  try {
    //*************** studentId input check
    if (typeof studentId !== 'string') {
      throw new Error('Invalid student id input');
    }
    const trimmedStudentId = studentId.trim();
    if (trimmedStudentId === '' || !mongoose.Types.ObjectId.isValid(trimmedStudentId)) {
      throw new Error('Invalid student id input');
    }

    //*************** set query for db operation
    const student = await StudentModel.findById(trimmedStudentId);

    //*************** check and extract referenced user_id if it exists
    if (!student) {
      return null;
    }
    const referencedUser = student.user_id;
    return referencedUser;
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
  if (date_of_birth) {
    //*************** validation to ensure date is in YYYY-MM-DD format
    date_of_birth = ValidateDateOfBirth(date_of_birth);
  }

  //*************** convert first_name and last_name to Title case
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
  if (school_id && !mongoose.Types.ObjectId.isValid(school_id)) {
    throw new Error('invalid school id');
  }
  if (date_of_birth) {
    //*************** validation to ensure date is in YYYY-MM-DD format
    date_of_birth = ValidateDateOfBirth(date_of_birth);
  }

  //*************** convert first_name and last_name to Title case
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
  if (date_of_birth) {
    //*************** validation to ensure date is in YYYY-MM-DD format
    date_of_birth = ValidateDateOfBirth(date_of_birth);
  }

  const validatedInput = { _id, first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

// *************** EXPORT MODULE ***************

module.exports = {
  StudentIsExist,
  StudentEmailIsExist,
  GetReferencedUserId,
  ValidateStudentCreateInput,
  ValidateStudentAndUserCreateInput,
  ValidateStudentUpdateInput,
};
