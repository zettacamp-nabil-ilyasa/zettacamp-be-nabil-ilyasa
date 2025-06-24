//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

//*************** IMPORT UTILS ***************
const { ToTitleCase } = require('../../utils/common');
const { ValidateId } = require('../../utils/common-validator');

//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//*************** regex pattern to ensure first and last name contains only letters
const userNameRegexPattern = /^[\p{L}\s'-]+$/u;

const createUserSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .pattern(userNameRegexPattern)
    .required()
    .messages({ 'string.pattern.base': 'first name contains invalid characters', 'any.required': 'first name is required' }),
  last_name: Joi.string()
    .trim()
    .pattern(userNameRegexPattern)
    .required()
    .messages({ 'string.pattern.base': 'last name contains invalid characters', 'any.required': 'last name is required' }),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({ 'string.email': 'email format is invalid', 'any.required': 'email is required' }),
  password: Joi.string()
    .trim()
    .pattern(passwordRegexPattern)
    .required()
    .messages({ 'string.min': 'password must be at least 8 characters', 'any.required': 'password is required' }),
});

const updateUserSchema = createUserSchema.fork(['first_name', 'last_name', 'email', 'password'], (schema) => schema.optional());

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserCreateInput(inputObject) {
  let { created_by, first_name, last_name, email, password } = inputObject;
  //*************** validate user id stored in created_by
  ValidateId(created_by);

  const { error, value } = createUserSchema.validate({ first_name, last_name, email, password }, { abortEarly: true });

  if (error) {
    throw new ApolloError(error.message);
  }

  return { created_by, first_name: ToTitleCase(value.first_name), last_name: ToTitleCase(value.last_name), email: value.email, password };
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
  ValidateId(_id);

  const { error, value } = updateUserSchema.validate({ first_name, last_name, email, password }, { abortEarly: true });

  if (error) {
    throw new ApolloError(error.message);
  }

  //*************** format first and last name to title case
  if (value.first_name) {
    first_name = ToTitleCase(value.first_name);
  }
  if (value.last_name) {
    last_name = ToTitleCase(value.last_name);
  }

  return {
    _id,
    first_name,
    last_name,
    email: value.email,
    password: value.password,
  };
}

/**
 * Validate input for role edit.
 * @param {object}} inputObject - The input object containing id, updater_id and role.
 * @returns {object} - The validated and formatted input.
 */
function ValidateEditRoleInput(inputObject) {
  let { _id, updater_id, role } = inputObject;
  //*************** _id input check
  ValidateId(_id);
  ValidateId(updater_id);
  if (!role) {
    throw new ApolloError('Role is required');
  }
  role = role.trim().toLowerCase();
  const validatedInput = { _id, updater_id, role };
  return validatedInput;
}

//*************** EXPORT MODULES ***************
module.exports = { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput };
