//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT UTILS ***************
const {
  SanitizeAndValidateId,
  SanitizeAndValidateRequiredString,
  SanitizeAndValidateOptionalString,
} = require('../../utils/common-validator.js');
const { ToTitleCase } = require('../../utils/common.js');

//*************** regex pattern to ensure school name only have letters and numbers
const schoolNameRegexPattern = /^[a-zA-Z\s'-\d]+$/;

//*************** regex pattern to ensure address is at least 5 characters
const addressRegexPattern = /^[a-zA-Z0-9\s,'./\-#()]{10,50}$/;

//*************** regex pattern to ensure city name is at least 2 characters
const cityNameRegexPattern = /^[a-zA-Z\s\-]{2,30}$/;

//*************** regex pattern to ensure country name is at least 2 characters
const countryNameRegexPattern = /^[a-zA-Z\s\-]{2,30}$/;

//*************** regex pattern to ensure zip code is at least 4 characters
const zipCodeRegexPattern = /^[A-Za-z0-9\s\-]{4,15}$/;

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - The validated and formatted input.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateSchoolCreateInput(inputObject) {
  let { brand_name, long_name, address, country, city, zipcode } = inputObject;

  brand_name = SanitizeAndValidateRequiredString(brand_name);
  if (!schoolNameRegexPattern.test(brand_name)) {
    throw new ApolloError('brand name contains invalid characters');
  }

  long_name = SanitizeAndValidateRequiredString(ToTitleCase(long_name));
  if (!schoolNameRegexPattern.test(long_name)) {
    throw new ApolloError('long name contains invalid characters');
  }
  address = SanitizeAndValidateOptionalString(address);
  if (!addressRegexPattern.test(address)) {
    throw new ApolloError('address contains invalid characters');
  }
  country = SanitizeAndValidateOptionalString(country);
  if (country && !countryNameRegexPattern.test(country)) {
    throw new ApolloError('country name contains invalid characters');
  }
  city = SanitizeAndValidateOptionalString(city);
  if (city && !cityNameRegexPattern.test(city)) {
    throw new ApolloError('city name contains invalid characters');
  }
  zipcode = SanitizeAndValidateOptionalString(zipcode);
  if (zipcode && !zipCodeRegexPattern.test(zipcode)) {
    throw new ApolloError('zip code contains invalid characters');
  }
  const validatedInput = { brand_name, long_name, address, country, city, zipcode };
  return validatedInput;
}

/**
 * Validates school update input.
 * @param {object} inputObject - The input object containing updated school data.
 * @returns {object} - The validated and formatted input.
 * @throws {import('apollo-server-core').ApolloError} - If validation fails.
 */
function ValidateSchoolUpdateInput(inputObject) {
  let { _id, brand_name, long_name, address, country, city, zipcode } = inputObject;

  //*************** validate ID, prevent null, undefined and non object id values
  _id = SanitizeAndValidateId(_id);

  if (brand_name) {
    //*************** validate brand name
    brand_name = SanitizeAndValidateRequiredString(brand_name);

    if (!schoolNameRegexPattern.test(brand_name)) {
      throw new ApolloError('brand name contains invalid characters');
    }
  }
  if (long_name) {
    //*************** validate long name and format to Title case
    long_name = SanitizeAndValidateRequiredString(ToTitleCase(long_name));
    if (!schoolNameRegexPattern.test(long_name)) {
      throw new ApolloError('long name contains invalid characters');
    }
  }
  if (address !== null && address !== undefined) {
    //*************** validate address
    address = SanitizeAndValidateOptionalString(address);

    if (!addressRegexPattern.test(address)) {
      throw new ApolloError('address contains invalid characters');
    }
  }
  if (country !== null && country !== undefined) {
    //*************** validate country
    country = SanitizeAndValidateOptionalString(country);

    if (!countryNameRegexPattern.test(country)) {
      throw new ApolloError('country name contains invalid characters');
    }
  }
  if (city !== null && city !== undefined) {
    //*************** validate city
    city = SanitizeAndValidateOptionalString(city);

    if (!cityNameRegexPattern.test(city)) {
      throw new ApolloError('city name contains invalid characters');
    }
  }
  if (zipcode !== null && zipcode !== undefined) {
    //*************** validate zip code
    zipcode = SanitizeAndValidateOptionalString(zipcode);

    if (!zipCodeRegexPattern.test(zipcode)) {
      throw new ApolloError('zip code contains invalid characters');
    }
  }
  const validatedInput = { _id, brand_name, long_name, address, country, city, zipcode };
  return validatedInput;
}

//*************** EXPORT MODULES ***************
module.exports = { ValidateSchoolCreateInput, ValidateSchoolUpdateInput };
