// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

// *************** regex pattern to ensure first and last name contains only letters
const studentNameRegexPattern = /^[\p{L}\s'-]+$/u;

// *************** regex pattern to ensure date is in DD-MM-YYYY format
const dateRegexPattern = /^\d{2}-\d{2}-\d{4}$/;

/**
 * Validates student creation input.
 * @param {object} inputObject - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentInput(inputObject) {
  // *************** joi schema for student create
  const studentSchema = Joi.object({
    first_name: Joi.string()
      .required()
      .trim()
      .pattern(studentNameRegexPattern)
      .messages({ 'string.pattern.base': 'first name contains invalid characters', 'any.required': 'first name is required' }),
    last_name: Joi.string()
      .required()
      .trim()
      .pattern(studentNameRegexPattern)
      .messages({ 'string.pattern.base': 'last name contains invalid characters', 'any.required': 'last name is required' }),
    email: Joi.string()
      .required()
      .trim()
      .email()
      .lowercase()
      .messages({ 'string.email': 'email format is invalid', 'any.required': 'email is required' }),
    date_of_birth: Joi.string()
      .optional()
      .trim()
      .pattern(dateRegexPattern)
      .allow('')
      .messages({ 'string.pattern.base': 'date of birth should be in DD-MM-YYYY format' }),
  });

  // *************** destructured input object
  let { first_name, last_name, email, date_of_birth } = inputObject;

  // *************** mandatory fields fail-fast
  if (!email) throw new ApolloError('email is required');
  if (!first_name) throw new ApolloError('first_name is required');
  if (!last_name) throw new ApolloError('last_name is required');

  // *************** validate input using joi schema
  const { error } = studentSchema.validate({ first_name, last_name, email, date_of_birth }, { abortEarly: true });

  // *************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

// *************** MODULE EXPORTS ***************
module.exports = { ValidateStudentInput };
