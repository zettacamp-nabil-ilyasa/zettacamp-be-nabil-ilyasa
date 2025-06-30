// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

// *************** regex pattern to ensure school name only contains letters, numbers, spaces, hyphens, and apostrophes
const schoolNameRegexPattern = /^[\p{L}\d\s'-]{2,50}$/u;

// *************** regex pattern to ensure address is at least 10 characters and at most 50
const addressRegexPattern = /^[\p{L}0-9\s,'./\-#()]{10,50}$/u;

// *************** regex pattern to ensure city name is at least 2 characters and at most 30
const cityRegexPattern = /^[\p{L}\s\-']{2,30}$/u;

// *************** regex pattern to ensure country name is at least 2 characters and at most 30
const countryRegexPattern = /^[\p{L}\s\-']{2,30}$/u;

// *************** regex pattern to ensure zip code is at least 4 characters and at most 15
const zipcodeRegexPattern = /^[A-Za-z0-9\s\-]{4,15}$/;

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - Sanitized and validated input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolCreateInput(inputObject) {
  // *************** joi schema for create school
  const createSchoolSchema = Joi.object({
    brand_name: Joi.string().required().trim().pattern(schoolNameRegexPattern).messages({
      'string.pattern.base': 'brand name must be at least 2 characters and cannot contain invalid characters',
      'any.required': 'brand name is required',
    }),
    long_name: Joi.string().required().trim().pattern(schoolNameRegexPattern).messages({
      'string.pattern.base': 'long name must be at least 2 characters and cannot contain invalid characters',
      'any.required': 'long name is required',
    }),
    address: Joi.string()
      .optional()
      .trim()
      .allow('', null)
      .pattern(addressRegexPattern)
      .messages({ 'string.pattern.base': 'address must be at least 10 characters and cannot contain invalid characters' }),
    country: Joi.string()
      .optional()
      .trim()
      .allow('', null)
      .pattern(countryRegexPattern)
      .messages({ 'string.pattern.base': 'country must be at least 2 characters and cannot contain invalid characters' }),
    city: Joi.string()
      .optional()
      .trim()
      .allow('', null)
      .pattern(cityRegexPattern)
      .messages({ 'string.pattern.base': 'city must be at least 2 characters and cannot contain invalid characters' }),
    zipcode: Joi.string()
      .optional()
      .allow('', null)
      .pattern(zipcodeRegexPattern)
      .messages({ 'string.pattern.base': 'zipcode must be at least 4 characters' }),
  });

  // *************** destructured input object
  let { brand_name, long_name, address, country, city, zipcode } = inputObject;

  // *************** validate input using joi schema
  const { error } = createSchoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  // *************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

/**
 * Validates school update input.
 * @param {object} inputObject - The input object containing updated school data.
 * @returns {object} - Sanitized and validated input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolUpdateInput(inputObject) {
  // *************** joi schema for update school
  const updateSchoolSchema = Joi.object({
    brand_name: Joi.string()
      .optional()
      .trim()
      .pattern(schoolNameRegexPattern)
      .messages({ 'string.pattern.base': 'brand name must be at least 2 characters and cannot contain invalid characters' }),
    long_name: Joi.string()
      .optional()
      .trim()
      .pattern(schoolNameRegexPattern)
      .messages({ 'string.pattern.base': 'long name must be at least 2 characters and cannot contain invalid characters' }),
    address: Joi.string()
      .optional()
      .trim()
      .allow('')
      .pattern(addressRegexPattern)
      .messages({ 'string.pattern.base': 'address must be at least 10 characters and cannot contain invalid characters' }),
    country: Joi.string()
      .optional()
      .trim()
      .allow('')
      .pattern(countryRegexPattern)
      .messages({ 'string.pattern.base': 'country must be at least 2 characters and cannot contain invalid characters' }),
    city: Joi.string()
      .optional()
      .trim()
      .allow('')
      .pattern(cityRegexPattern)
      .messages({ 'string.pattern.base': 'city must be at least 2 characters and cannot contains invalid characters' }),
    zipcode: Joi.string()
      .optional()
      .trim()
      .allow('')
      .pattern(zipcodeRegexPattern)
      .messages({ 'string.pattern.base': 'zipcode must be at least 4 characters and cannot contain invalid characters' }),
  });

  // *************** destructured input object
  let { brand_name, long_name, address, country, city, zipcode } = inputObject;

  // *************** validate input using joi schema
  const { error } = updateSchoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  // *************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = { ValidateSchoolCreateInput, ValidateSchoolUpdateInput };
