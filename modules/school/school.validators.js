// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Joi = require('joi');

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - Sanitized and validated input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolInput(inputObject) {
  // *************** joi schema for create school
  const schoolSchema = Joi.object({
    brand_name: Joi.string().required().messages({
      'any.required': 'brand name is required',
    }),
    long_name: Joi.string().required().messages({
      'any.required': 'long name is required',
    }),
    address: Joi.string().optional().allow('', null),
    country: Joi.string().optional().allow('', null),
    city: Joi.string().optional().allow('', null),
    zipcode: Joi.string().optional().allow('', null),
  });

  // *************** destructured input object
  let { brand_name, long_name, address, country, city, zipcode } = inputObject;

  // *************** mandatory fields fail-fast
  if (!long_name) throw new ApolloError('long_name is required');
  if (!brand_name) throw new ApolloError('brand_name is required');

  // *************** validate input using joi schema
  const { error } = schoolSchema.validate({ brand_name, long_name, address, country, city, zipcode }, { abortEarly: true });

  // *************** throw error if joi validation fails
  if (error) {
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = { ValidateSchoolInput };
