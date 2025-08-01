// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const SchoolModel = require('./school.model');
const ErrorLogModel = require('../errorLog/error_log.model.js');

/**
 * Validates the school input object for required and optional fields.
 * @param {Object} input - The input object containing school data.
 * @param {string} input.brand_name - The brand name of the school.
 * @param {string} input.long_name - The long (formal/official) name of the school.
 * @param {string} [input.address] - Address of the school (optional).
 * @param {string} [input.country] - Country where the school is located (optional).
 * @param {string} [input.city] - City where the school is located (optional).
 * @param {string} [input.zipcode] - Zip code of the school (optional).
 * @throws {ApolloError} - If any field is missing or has the wrong type.
 */
function ValidateSchoolInput(input) {
  // *************** destructured input object
  let { brand_name, long_name, address, country, city, zipcode } = input;

  // *************** validate school's long_name
  if (!long_name || typeof long_name !== 'string') throw new ApolloError('long_name is required');

  // *************** validate school's brand_name
  if (!brand_name || typeof brand_name !== 'string') throw new ApolloError('brand_name is required');

  // *************** validate school's address
  if (address && typeof address !== 'string') throw new ApolloError('address must be a string');

  // *************** validate school's country
  if (country && typeof country !== 'string') throw new ApolloError('country must be a string');

  // *************** validate school's city
  if (city && typeof city !== 'string') throw new ApolloError('city must be a string');

  // *************** validate school's zipcode
  if (zipcode && typeof zipcode !== 'string') throw new ApolloError('zipcode must be a string');
}

/**
 * Check if a school's long name already exists in the database
 * @async
 * @param {string} longName - The school's long name to be checked.
 * @throws {ApolloError} - If both names are missing, invalid ID, or DB operation fails.
 */
async function ValidateUniqueSchoolLongName(longName) {
  try {
    // *************** validate longName input
    if (!longName) {
      throw new ApolloError('long_name is required');
    }

    // *************** find the school with longName
    const schoolLongNameIsExist = await SchoolModel.findOne({ long_name: longName.trim(), status: 'active' }).lean();

    // *************** throw error if long_name is already exist
    if (schoolLongNameIsExist) {
      throw new ApolloError('long_name already used by another School');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'ValidateUniqueSchoolLongName',
      path: '/modules/school/school.validator.js',
      parameter_input: JSON.stringify({ longName }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Validates the school input object for required and optional fields.
 * @param {Object} input - The input object containing filter data for schools query.
 * @param {string} input.country - School's country for filter.
 * @param {string} input.student_name - Student's name which connected to school for filter
 * @throws {ApolloError} - If any field is missing or has the wrong type.
 */
function ValidateSchoolFilterInput(input) {
  // *************** validate country from input if provided
  if (input?.country && typeof input?.country !== 'string') throw new ApolloError('country must be a string');

  // *************** validate student_name from input if provided
  if (input?.student_name && typeof input?.student_name !== 'string') throw new ApolloError('student_last_name must be a string');
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateSchoolInput, ValidateUniqueSchoolLongName, ValidateSchoolFilterInput };
