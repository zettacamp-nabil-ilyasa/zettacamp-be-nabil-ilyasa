// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Validates the school input object for required and optional fields.
 * @param {Object} inputObject - The input object containing school data.
 * @param {string} inputObject.brand_name - The brand name of the school.
 * @param {string} inputObject.long_name - The long (formal/official) name of the school.
 * @param {string} [inputObject.address] - Address of the school (optional).
 * @param {string} [inputObject.country] - Country where the school is located (optional).
 * @param {string} [inputObject.city] - City where the school is located (optional).
 * @param {string} [inputObject.zipcode] - Zip code of the school (optional).
 * @throws {ApolloError} - If any field is missing or has the wrong type.
 */
function ValidateSchoolInput(inputObject) {
  // *************** destructured input object
  let { brand_name, long_name, address, country, city, zipcode } = inputObject;

  // *************** validate school's long_name
  if (typeof long_name !== 'string' || long_name.trim() === '') throw new ApolloError('long_name is required');

  // *************** validate school's brand_name
  if (typeof brand_name !== 'string' || brand_name.trim() === '') throw new ApolloError('brand_name is required');

  // *************** validate school's address
  if (typeof address !== 'undefined' && typeof address !== 'string') throw new ApolloError('address must be a string');

  // *************** validate school's country
  if (typeof country !== 'undefined' && typeof country !== 'string') throw new ApolloError('country must be a string');

  // *************** validate school's city
  if (typeof city !== 'undefined' && typeof city !== 'string') throw new ApolloError('city must be a string');

  // *************** validate school's zipcode
  if (typeof zipcode !== 'undefined' && typeof zipcode !== 'string') throw new ApolloError('zipcode must be a string');
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateSchoolInput };
