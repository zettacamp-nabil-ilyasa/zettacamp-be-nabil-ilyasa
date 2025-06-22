//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT UTILS ***************
const { ToTitleCase } = require('../../utils/common');
const {
  SanitizeAndValidateId,
  SanitizeAndValidateRequiredString,
  SanitizeAndValidateOptionalString,
} = require('../../utils/common-validator');

//*************** regex pattern to ensure email is includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/;
//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//*************** regex pattern to ensure first and last name contains only letters
const firstAndLastNameRegexPattern = /^[a-zA-Z\s'-]+$/;

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserCreateInput(inputObject) {
  let { first_name, last_name, email, password } = inputObject;

  if (!emailRegexPattern.test(email)) {
    throw new ApolloError('email format is invalid');
  }
  if (!passwordRegexPattern.test(password)) {
    throw new ApolloError(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }

  //*************** validate first_name and convert to Title case
  first_name = SanitizeAndValidateRequiredString(ToTitleCase(first_name));
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new ApolloError('first name contains invalid characters');
  }

  //*************** validate last_name and convert to Title case
  last_name = SanitizeAndValidateRequiredString(ToTitleCase(last_name));
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new ApolloError('last name contains invalid characters');
  }
  const validatedInput = { first_name, last_name, email, password };
  return validatedInput;
}

/**
 * Validates user update input.
 * @param {object} input - The input object containing updated user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserUpdateInput(inputObject) {
  let { _id, first_name, last_name, email, password } = inputObject;

  //*************** _id input check
  _id = SanitizeAndValidateId(_id);

  if (email && !emailRegexPattern.test(email)) {
    throw new ApolloError('email format is invalid');
  }
  if (password && !passwordRegexPattern.test(password)) {
    throw new ApolloError(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (first_name) {
    //*************** validate first_name and convert to Title case
    first_name = SanitizeAndValidateOptionalString(ToTitleCase(first_name));
    if (!firstAndLastNameRegexPattern.test(first_name)) {
      throw new ApolloError('first name contains invalid characters');
    }
  }
  if (last_name) {
    last_name = SanitizeAndValidateOptionalString(ToTitleCase(last_name));
    if (!firstAndLastNameRegexPattern.test(last_name)) {
      throw new ApolloError('last name contains invalid characters');
    }
  }
  const validatedInput = { _id, first_name, last_name, email, password };
  return validatedInput;
}

/**
 * Validate input for role edit.
 * @param {object}} inputObject - The input object containing id, updater_id and role.
 * @returns {object} - The validated and formatted input.
 */
function ValidateEditRoleInput(inputObject) {
  let { _id, updater_id, role } = inputObject;
  //*************** _id input check
  _id = SanitizeAndValidateId(_id);
  updater_id = SanitizeAndValidateId(updater_id);
  role = SanitizeAndValidateRequiredString(role);
  const validatedInput = { _id, updater_id, role };
  return validatedInput;
}

//*************** EXPORT MODULES ***************
module.exports = { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput };
