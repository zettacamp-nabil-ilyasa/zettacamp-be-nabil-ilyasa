//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

//*************** IMPORT UTIL ***************
const { ValidateId } = require('../../utils/common-validator.js');

//*************** regex pattern to ensure school name only contains letters, numbers, spaces, hyphens, and apostrophes
const schoolRegexPattern = /^[\p{L}\d\s'-]+$/u;

//*************** regex pattern to ensure address is at least 5 characters and at most 50
const addressRegexPattern = /^[\p{L}0-9\s,'./\-#()]{10,50}$/u;

//*************** regex pattern to ensure city name is at least 2 characters and at most 30
const cityRegexPattern = /^[\p{L}\s\-']{2,30}$/u;

//*************** regex pattern to ensure country name is at least 2 characters and at most 30
const countryRegexPattern = /^[\p{L}\s\-']{2,30}$/u;

//*************** regex pattern to ensure zip code is at least 4 characters and at most 15
const zipcodeRegexPattern = /^[A-Za-z0-9\s\-]{4,15}$/;

//*************** joi schema for create school
const createSchoolSchema = Joi.object({
  brand_name: Joi.string()
    .required()
    .trim()
    .pattern(schoolRegexPattern)
    .messages({ 'string.pattern.base': 'brand name contains invalid characters', 'any.required': 'brand name is required' }),
  long_name: Joi.string()
    .required()
    .trim()
    .pattern(schoolRegexPattern)
    .messages({ 'string.pattern.base': 'long name contains invalid characters', 'any.required': 'long name is required' }),
  address: Joi.string()
    .optional()
    .trim()
    .allow('', null)
    .pattern(addressRegexPattern)
    .messages({ 'string.pattern.base': 'address contains invalid characters' }),
  country: Joi.string()
    .optional()
    .trim()
    .allow('', null)
    .pattern(countryRegexPattern)
    .messages({ 'string.pattern.base': 'country contains invalid characters' }),
  city: Joi.string()
    .optional()
    .trim()
    .allow('', null)
    .pattern(cityRegexPattern)
    .messages({ 'string.pattern.base': 'city contains invalid characters' }),
  zipcode: Joi.string()
    .optional()
    .allow('', null)
    .pattern(zipcodeRegexPattern)
    .messages({ 'string.pattern.base': 'zipcode contains invalid characters' }),
});

//*************** joi schema for update school
const updateSchoolSchema = Joi.object({
  brand_name: Joi.string()
    .optional()
    .trim()
    .pattern(schoolRegexPattern)
    .messages({ 'string.pattern.base': 'brand name contains invalid characters' }),
  long_name: Joi.string()
    .optional()
    .trim()
    .pattern(schoolRegexPattern)
    .optional()
    .messages({ 'string.pattern.base': 'long name contains invalid characters' }),
  address: Joi.string()
    .optional()
    .trim()
    .allow('')
    .pattern(addressRegexPattern)
    .messages({ 'string.pattern.base': 'address contains invalid characters' }),
  country: Joi.string()
    .optional()
    .trim()
    .allow('')
    .pattern(countryRegexPattern)
    .messages({ 'string.pattern.base': 'country contains invalid characters' }),
  city: Joi.string()
    .optional()
    .trim()
    .allow('')
    .pattern(cityRegexPattern)
    .messages({ 'string.pattern.base': 'city contains invalid characters' }),
  zipcode: Joi.string()
    .optional()
    .allow('')
    .pattern(zipcodeRegexPattern)
    .messages({ 'string.pattern.base': 'zipcode contains invalid characters' }),
});

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - Sanitized and validated input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolCreateInput(inputObject) {
  let { created_by, brand_name, long_name, address, country, city, zipcode } = inputObject;

  //*************** validate id
  ValidateId(created_by);
  //*************** check if brand_name and long_name are provided
  if (!brand_name) throw new ApolloError('brand_name is required');
  if (!long_name) throw new ApolloError('long_name is required');

  //*************** validate input using joi schema
  const { error } = createSchoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  //*************** throw error if joi validation fails
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
  let { _id, brand_name, long_name, address, country, city, zipcode } = inputObject;

  //*************** validate id
  ValidateId(_id);

  //*************** validate input using joi schema
  const { error } = updateSchoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  //*************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

//*************** EXPORT MODULES ***************
module.exports = { ValidateSchoolCreateInput, ValidateSchoolUpdateInput };
