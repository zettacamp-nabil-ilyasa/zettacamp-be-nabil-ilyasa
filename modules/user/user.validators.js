// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

/**
 * Check if role is valid
 * @param {string} role - The role to be checked.
 * @throws {Error} - If failed validation.
 */
function ValidateRole(role) {
  // *************** role input check
  if (!role) {
    throw new ApolloError('role is required');
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
function ValidateUserInput(inputObject) {
  // *************** joi schema for create user
  const userSchema = Joi.object({
    first_name: Joi.string().required().messages({ 'any.required': 'first name is required' }),
    last_name: Joi.string().required().messages({ 'any.required': 'last name is required' }),
    email: Joi.string()
      .required()
      .trim()
      .email()
      .lowercase()
      .messages({ 'string.email': 'email format is invalid', 'any.required': 'email is required' }),
  });

  // *************** destructured input object
  let { first_name, last_name, email, role } = inputObject;

  // *************** mandatory fields fail-fast
  if (!email) throw new ApolloError('email is required');
  if (!first_name) throw new ApolloError('first_name is required');
  if (!last_name) throw new ApolloError('last_name is required');
  ValidateRole(role);

  // *************** validate input using joi schema
  const { error } = userSchema.validate({ first_name, last_name, email }, { abortEarly: true });

  // *************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = { ValidateUserInput };
