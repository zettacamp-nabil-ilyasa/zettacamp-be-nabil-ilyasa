// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

/**
 * Validates student creation input.
 * @param {object} inputObject - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentInput(inputObject) {
  // *************** joi schema for student create
  const studentSchema = Joi.object({
    first_name: Joi.string().required().messages({ 'any.required': 'first name is required' }),
    last_name: Joi.string().required().messages({ 'any.required': 'last name is required' }),
    email: Joi.string()
      .required()
      .trim()
      .email()
      .lowercase()
      .messages({ 'string.email': 'email format is invalid', 'any.required': 'email is required' }),
    date_of_birth: Joi.string().required().messages({ 'any.required': 'date of birth is required' }),
  });

  // *************** destructured input object
  let { first_name, last_name, email, date_of_birth } = inputObject;

  // *************** mandatory fields fail-fast
  if (!email) throw new ApolloError('email is required');
  if (!first_name) throw new ApolloError('first_name is required');
  if (!last_name) throw new ApolloError('last_name is required');
  if (!date_of_birth) throw new ApolloError('date_of_birth is required');

  // *************** validate input using joi schema
  const { error } = studentSchema.validate({ first_name, last_name, email, date_of_birth }, { abortEarly: true });

  // *************** validate date_of_birth string
  const parsedDate = date_of_birth instanceof Date ? date_of_birth : new Date(date_of_birth);
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 1900 || parsedDate.getTime() > Date.now())
    throw new ApolloError('date_of_birth should be in YYYY-MM-DD, not earlier than 1900, and not in the future');

  // *************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

// *************** MODULE EXPORTS ***************
module.exports = { ValidateStudentInput };
