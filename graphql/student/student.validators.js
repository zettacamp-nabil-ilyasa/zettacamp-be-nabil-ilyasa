//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

//*************** IMPORT UTILS ***************
const { ToTitleCase, ConvertStringToDate } = require('../../utils/common');
const { ValidateId } = require('../../utils/common-validator');

//*************** regex pattern to ensure first and last name contains only letters
const studentNameRegexPattern = /^[\p{L}\s'-]+$/u;

//*************** regex pattern to ensure date is in DD-MM-YYYY format
const dateRegexPattern = /^\d{2}-\d{2}-\d{4}$/;

//*************** joi schema for student create
const createStudentSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .pattern(studentNameRegexPattern)
    .required()
    .messages({ 'string.pattern.base': 'first name contains invalid characters', 'any.required': 'first name is required' }),
  last_name: Joi.string()
    .trim()
    .pattern(studentNameRegexPattern)
    .required()
    .messages({ 'string.pattern.base': 'last name contains invalid characters', 'any.required': 'last name is required' }),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({ 'string.email': 'email format is invalid', 'any.required': 'email is required' }),
  date_of_birth: Joi.string()
    .trim()
    .pattern(dateRegexPattern)
    .optional()
    .allow('')
    .custom(JoiValidateDateOfBirth, 'Custom date of birth validation')
    .messages({ 'string.pattern.base': 'date of birth should be in DD-MM-YYYY format', 'any.invalid': '{{#message}}' }),
});

//*************** joi schema for student update
const updateStudentSchema = createStudentSchema.fork(['first_name', 'last_name', 'email'], (schema) => schema.optional());

/**
 * Joi custom function for date of birth validation
 * @param {string} dateInput - The date to be validated.
 * @returns {Date | null} - Validated date.
 * @throws {Error} - If validation fails.
 */
function JoiValidateDateOfBirth(value, helpers) {
  //*************** check if value is a string
  if (typeof value !== 'string') {
    return helpers.error('any.invalid', { message: 'Date of birth is invalid' });
  }

  //*************** parse date to date object
  const birthDate = ConvertStringToDate(value);
  const today = new Date();

  //*************** check if date is an invalid date
  if (isNaN(birthDate.getTime())) {
    return helpers.error('any.invalid', { message: 'Invalid date format' });
  }

  //*************** check if date is in the future
  if (birthDate > today) {
    return helpers.error('any.invalid', { message: 'Date of birth cannot be in the future' });
  }
  return birthDate;
}

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

  //*************** validate input using joi schema
  const { error, value } = createStudentSchema.validate({ first_name, last_name, email, date_of_birth }, { abortEarly: true });
  if (error) {
    throw new ApolloError(error.message);
  }

  return {
    created_by,
    first_name: ToTitleCase(value.first_name),
    last_name: ToTitleCase(value.last_name),
    email: value.email.toLowerCase(),
    date_of_birth: value.date_of_birth,
    school_id,
  };
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
  const { error, value } = updateStudentSchema.validate({ first_name, last_name, email, date_of_birth }, { abortEarly: true });
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
    date_of_birth: value.date_of_birth,
    school_id,
  };
}

//*************** MODULE EXPORTS ***************
module.exports = { ValidateStudentCreateInput, ValidateStudentUpdateInput };
