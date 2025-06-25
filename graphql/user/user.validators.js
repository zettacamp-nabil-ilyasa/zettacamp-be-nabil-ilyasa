//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

//*************** IMPORT UTIL ***************
const { ValidateId } = require('../../utils/common-validator');

//*************** IMPORT HELPER ***************
const { RoleIsValid } = require('./user.helpers.js');

//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//*************** regex pattern to ensure first and last name contains only letters
const userNameRegexPattern = /^[\p{L}\s'-]+$/u;

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserCreateInput(inputObject) {
  //*************** joi schema for create user
  const createUserSchema = Joi.object({
    first_name: Joi.string()
      .required()
      .trim()
      .pattern(userNameRegexPattern)
      .messages({ 'string.pattern.base': 'first name contains invalid characters', 'any.required': 'first name is required' }),
    last_name: Joi.string()
      .required()
      .trim()
      .pattern(userNameRegexPattern)
      .messages({ 'string.pattern.base': 'last name contains invalid characters', 'any.required': 'last name is required' }),
    email: Joi.string()
      .required()
      .trim()
      .email()
      .lowercase()
      .messages({ 'string.email': 'email format is invalid', 'any.required': 'email is required' }),
    password: Joi.string()
      .required()
      .trim()
      .pattern(passwordRegexPattern)
      .messages({ 'string.min': 'password must be at least 8 characters', 'any.required': 'password is required' }),
  });

  let { created_by, first_name, last_name, email, password } = inputObject;
  //*************** validate user id stored in created_by
  ValidateId(created_by);

  //*************** check if first_name, last_name and email are provided
  if (!email) throw new ApolloError('email is required');
  if (!password) throw new ApolloError('password is required');
  if (!first_name) throw new ApolloError('first name is required');
  if (!last_name) throw new ApolloError('last name is required');

  //*************** validate input using joi schema
  const { error } = createUserSchema.validate({ first_name, last_name, email, password }, { abortEarly: true });

  //*************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

/**
 * Validates user update input.
 * @param {object} input - The input object containing updated user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserUpdateInput(inputObject) {
  //*************** joi schema for update user
  const updateUserSchema = Joi.object({
    first_name: Joi.string()
      .optional()
      .trim()
      .pattern(userNameRegexPattern)
      .messages({ 'string.pattern.base': 'first name contains invalid characters' }),
    last_name: Joi.string()
      .optional()
      .trim()
      .pattern(userNameRegexPattern)
      .messages({ 'string.pattern.base': 'last name contains invalid characters' }),
    email: Joi.string().optional().trim().lowercase().email().messages({ 'string.email': 'email format is invalid' }),
    password: Joi.string()
      .optional()
      .trim()
      .pattern(passwordRegexPattern)
      .messages({ 'string.min': 'password must be at least 8 characters' }),
  });

  let { _id, first_name, last_name, email, password } = inputObject;

  //*************** _id input check
  ValidateId(_id);

  //*************** validate input using joi schema
  const { error } = updateUserSchema.validate({ first_name, last_name, email, password }, { abortEarly: true });

  //*************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
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
  RoleIsValid(role);
}

//*************** EXPORT MODULES ***************
module.exports = { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput };
