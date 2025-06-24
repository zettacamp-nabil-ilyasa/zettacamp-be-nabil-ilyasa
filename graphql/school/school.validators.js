//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

//*************** IMPORT UTILS ***************
const { ValidateId } = require('../../utils/common-validator.js');
const { ToTitleCase } = require('../../utils/common.js');

//*************** regex pattern to ensure school name only have letters and numbers
const schoolRegexPattern = /^[\p{L}\d\s'-]+$/u;

//*************** regex pattern to ensure address is at least 5 characters
const addressRegexPattern = /^[\p{L}0-9\s,'./\-#()]{10,50}$/u;

//*************** regex pattern to ensure city name is at least 2 characters
const cityRegexPattern = /^[\p{L}\s\-']{2,30}$/u;

//*************** regex pattern to ensure country name is at least 2 characters
const countryRegexPattern = /^[\p{L}\s\-']{2,30}$/u;

//*************** regex pattern to ensure zip code is at least 4 characters
const zipcodeRegexPattern = /^[A-Za-z0-9\s\-]{4,15}$/;

//*************** joi schema for create school
const createSchoolSchema = Joi.object({
  brand_name: Joi.string()
    .trim()
    .pattern(schoolRegexPattern)
    .required()
    .messages({ 'string.pattern.base': 'brand name contains invalid characters', 'any.required': 'brand name is required' }),
  long_name: Joi.string()
    .trim()
    .pattern(schoolRegexPattern)
    .required()
    .messages({ 'string.pattern.base': 'long name contains invalid characters', 'any.required': 'long name is required' }),
  address: Joi.string()
    .trim()
    .allow('', null)
    .pattern(addressRegexPattern)
    .messages({ 'string.pattern.base': 'address contains invalid characters' }),
  country: Joi.string()
    .trim()
    .allow('', null)
    .pattern(countryRegexPattern)
    .messages({ 'string.pattern.base': 'country contains invalid characters' }),
  city: Joi.string()
    .trim()
    .allow('', null)
    .pattern(cityRegexPattern)
    .messages({ 'string.pattern.base': 'city contains invalid characters' }),
  zipcode: Joi.string()
    .allow('', null)
    .pattern(zipcodeRegexPattern)
    .messages({ 'string.pattern.base': 'zipcode contains invalid characters' }),
});

//*************** joi schema for update school
const updateSchoolSchema = createSchoolSchema.fork(['brand_name', 'long_name'], (schema) => schema.optional());

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - Sanitized and validated input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolCreateInput(inputObject) {
  let { created_by, brand_name, long_name, address, country, city, zipcode } = inputObject;

  //*************** validate created_by, prevent null, undefined and non object id values
  ValidateId(created_by);
  const { error, value } = createSchoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  if (error) {
    throw new ApolloError(error.message);
  }

  return {
    created_by,
    brand_name: value.brand_name,
    long_name: ToTitleCase(value.long_name),
    address: value.address,
    country: value.country,
    city: value.city,
    zipcode: value.zipcode,
  };
}

/**
 * Validates school update input.
 * @param {object} inputObject - The input object containing updated school data.
 * @returns {object} - Sanitized and validated input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolUpdateInput(inputObject) {
  let { _id, brand_name, long_name, address, country, city, zipcode } = inputObject;

  //*************** validate _id, prevent null, undefined and non object id values
  ValidateId(_id);
  const { error, value } = updateSchoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  if (error) {
    throw new ApolloError(error.message);
  }

  //*************** format long name to title case
  if (value.long_name) {
    long_name = ToTitleCase(value.long_name);
  }
  return {
    _id,
    brand_name: value.brand_name,
    long_name,
    address: value.address,
    country: value.country,
    city: value.city,
    zipcode: value.zipcode,
  };
}

//*************** EXPORT MODULES ***************
module.exports = { ValidateSchoolCreateInput, ValidateSchoolUpdateInput };
