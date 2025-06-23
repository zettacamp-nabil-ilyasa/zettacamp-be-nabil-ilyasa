//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT UTILS ***************
const { ToTitleCase, ParseDateDmy } = require('../../utils/common');
const { SanitizeAndValidateId, SanitizeAndValidateRequiredString } = require('../../utils/common-validator');

//*************** regex pattern to ensure email includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/;

//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//*************** regex pattern to ensure first and last name contains only letters
const firstAndLastNameRegexPattern = /^[\p{L}\s'-]+$/u;

//*************** regex pattern to ensure date is in DD-MM-YYYY format
const dateRegexPattern = /^\d{2}-\d{2}-\d{4}$/;

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
    throw new ApolloError('Invalid date input');
  }
  const trimmedDate = dateInput.trim();
  if (trimmedDate === '') {
    return null;
  }

  //*************** check with regex pattern to ensure date is in DD-MM-YYYY format
  if (!dateRegexPattern.test(trimmedDate)) {
    throw new ApolloError('Date should be in DD-MM-YYYY format');
  }

  //*************** convert dateInput to Date object
  birthDate = ParseDateDmy(trimmedDate);
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

/**
 * Validates student creation input.
 * @param {object} input - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentCreateInput(inputObject) {
  let { first_name, last_name, email, date_of_birth, school_id } = inputObject;

  //*************** validate school_id
  school_id = SanitizeAndValidateId(school_id);

  if (!emailRegexPattern.test(email)) {
    throw new ApolloError('email format is invalid');
  }
  first_name = SanitizeAndValidateRequiredString(ToTitleCase(first_name));
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new ApolloError('first name contains invalid characters');
  }
  last_name = SanitizeAndValidateRequiredString(ToTitleCase(last_name));
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new ApolloError('last name contains invalid characters');
  }
  if (date_of_birth !== null && date_of_birth !== undefined) {
    //*************** validation to ensure date is in YYYY-MM-DD format
    date_of_birth = ValidateDateOfBirth(date_of_birth);
  }
  const validatedInput = { first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

/**
 * Validates input for creating both a user and a student.
 * @param {object} input - The combined input object.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentAndUserCreateInput(inputObject) {
  let { first_name, last_name, email, password, date_of_birth, school_id } = inputObject;

  if (!emailRegexPattern.test(email)) {
    throw new ApolloError('email format is invalid');
  }
  if (!passwordRegexPattern.test(password)) {
    throw new ApolloError(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  first_name = SanitizeAndValidateRequiredString(ToTitleCase(first_name));
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new ApolloError('first name contains invalid characters');
  }
  last_name = SanitizeAndValidateRequiredString(ToTitleCase(last_name));
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new ApolloError('last name contains invalid characters');
  }

  //*************** validate school_id
  school_id = SanitizeAndValidateId(school_id);

  if (date_of_birth !== null && date_of_birth !== undefined) {
    //*************** validation to ensure date is in YYYY-MM-DD format
    date_of_birth = ValidateDateOfBirth(date_of_birth);
  }
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

  //*************** validate _id
  _id = SanitizeAndValidateId(_id);

  if (email && !emailRegexPattern.test(email)) {
    throw new ApolloError('email format is invalid');
  }
  if (first_name) {
    first_name = SanitizeAndValidateRequiredString(ToTitleCase(first_name));
    if (!firstAndLastNameRegexPattern.test(first_name)) {
      throw new ApolloError('first name contains invalid characters');
    }
  }
  if (last_name) {
    last_name = SanitizeAndValidateRequiredString(ToTitleCase(last_name));
    if (!firstAndLastNameRegexPattern.test(last_name)) {
      throw new ApolloError('last name contains invalid characters');
    }
  }
  if (school_id) {
    school_id = SanitizeAndValidateId(school_id);
  }
  if (date_of_birth !== null && date_of_birth !== undefined) {
    //*************** validation to ensure date is in YYYY-MM-DD format
    date_of_birth = ValidateDateOfBirth(date_of_birth);
  }
  const validatedInput = { _id, first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

//*************** MODULE EXPORTS ***************
module.exports = { ValidateStudentCreateInput, ValidateStudentUpdateInput, ValidateStudentAndUserCreateInput };
