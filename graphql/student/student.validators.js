//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

//*************** IMPORT UTILS ***************
const { ValidateId } = require('../../utils/common-validator');

//*************** regex pattern to ensure first and last name contains only letters
const studentNameRegexPattern = /^[\p{L}\s'-]+$/u;

//*************** regex pattern to ensure date is in DD-MM-YYYY format
const dateRegexPattern = /^\d{2}-\d{2}-\d{4}$/;

//*************** joi schema for student create
const createStudentSchema = Joi.object({
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

//*************** joi schema for student update
const updateStudentSchema = Joi.object({
  first_name: Joi.string()
    .optional()
    .trim()
    .pattern(studentNameRegexPattern)
    .messages({ 'string.pattern.base': 'first name contains invalid characters', 'any.required': 'first name is required' }),
  last_name: Joi.string()
    .optional()
    .trim()
    .pattern(studentNameRegexPattern)
    .messages({ 'string.pattern.base': 'last name contains invalid characters', 'any.required': 'last name is required' }),
  email: Joi.string()
    .optional()
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

/**
 * Validates student creation input.
 * @param {object} inputObject - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentCreateInput(inputObject) {
  let { created_by, first_name, last_name, email, date_of_birth, school_id } = inputObject;

  //*************** validate id
  ValidateId(created_by);
  ValidateId(school_id);

  //*************** check if first_name, last_name and email are provided
  if (!first_name) throw new ApolloError('first name is required');
  if (!last_name) throw new ApolloError('last name is required');
  if (!email) throw new ApolloError('email is required');

  //*************** validate input using joi schema
  const { error } = createStudentSchema.validate({ first_name, last_name, email, date_of_birth }, { abortEarly: true });

  //*************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

/**
 * Validates student update input.
 * @param {object} inputObject - The input object containing updated student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentUpdateInput(inputObject) {
  let { _id, first_name, last_name, email, date_of_birth, school_id } = inputObject;

  //*************** validate _id
  ValidateId(_id);
  if (school_id) {
    ValidateId(school_id);
  }

  //*************** validate input using joi schema
  const { error } = updateStudentSchema.validate({ first_name, last_name, email, date_of_birth }, { abortEarly: true });

  //*************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

//*************** MODULE EXPORTS ***************
module.exports = { ValidateStudentCreateInput, ValidateStudentUpdateInput };
