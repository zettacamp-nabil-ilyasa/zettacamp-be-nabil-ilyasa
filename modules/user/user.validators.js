// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

// *************** IMPORT UTIL ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator');

// *************** regex pattern to ensure first and last name contains only letters
const userNameRegexPattern = /^[\p{L}\s'-]+$/u;

/**
 * Check if role is valid
 * @param {string} role - The role to be checked.
 * @throws {Error} - If failed validation.
 */
function ValidateRole(role) {
  // *************** role input check
  if (!role) {
    throw new ApolloError('Invalid role input');
  }

  const validRoles = ['admin', 'user'];

  // *************** check if role is a valid role
  const isValidRole = validRoles.includes(role);
  if (!isValidRole) {
    throw new ApolloError('Invalid role');
  }
}

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserCreateInput(inputObject) {
  // *************** joi schema for create user
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
  });

  // ***************  destructured input object
  let { first_name, last_name, email } = inputObject;

  // *************** check if first_name, last_name and email are provided
  if (!email) throw new ApolloError('email is required');
  if (!first_name) throw new ApolloError('first name is required');
  if (!last_name) throw new ApolloError('last name is required');

  // *************** validate input using joi schema
  const { error } = createUserSchema.validate({ first_name, last_name, email }, { abortEarly: true });

  // *************** throw error if joi validation fails
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
  // *************** joi schema for update user
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
  });

  // *************** destructured input object
  let { _id, first_name, last_name, email } = inputObject;

  // *************** validate id
  ValidateId(_id);

  // *************** validate input using joi schema
  const { error } = updateUserSchema.validate({ first_name, last_name, email }, { abortEarly: true });

  // *************** throw error if joi validation fails
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
  let { _id, role } = inputObject;
  // *************** validate ids
  ValidateId(_id);

  // *************** validate role
  ValidateRole(role);
}

// *************** EXPORT MODULES ***************
module.exports = { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput, ValidateRole };
