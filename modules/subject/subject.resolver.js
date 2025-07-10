// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SubjectModel = require('./subject.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateSubjectInput } = require('./subject.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// **************** QUERY ****************
/**
 * Get all subjects with optional filtering by block_id and pagination.
 * @async
 * @function GetAllSubjects
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {string} [filterInput.block_id] - Optional block ID to filter subjects
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {number} [paginationInput.limit] - Number of subjects per page
 * @param {number} [paginationInput.offset] - Number of subjects to skip
 * @returns {Promise<Array<Object>>} Array of subject documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllSubjects({ filterInput, paginationInput }) {
  try {
    // **************** construct base query
    const query = { status: 'active' };

    // **************** check if filter input provided
    if (filterInput.block_id) {
      // **************** validate block's _id, ensure that it can be casted into valid ObjectId
      ValidateMongoObjectId(filterInput.block_id);
      // **************** add filter to query
      query.block_id = filterInput.block_id;
    }

    // **************** get subjects based on query
    const subjects = await SubjectModel.find(query)
      .skip(paginationInput.offset || 0)
      .limit(paginationInput.limit || 20)
      .lean();
    return subjects;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllSubjects',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}
