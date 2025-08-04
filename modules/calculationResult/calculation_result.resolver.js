// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const CalculationResultModel = require('./calculation_result.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { allowedRoles } = require('../../shared/strings.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** QUERY ****************
/**
 * Get all calculation results from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of calculation results documents with active status.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllCalculationResults(parent, args, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.CalculationResult.GetCalculationResults });
    const calculationResults = await CalculationResultModel.find({ status: 'active' }).lean();
    return calculationResults;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllCalculationResults',
      path: '/modules/calculationResult/calculation_result.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active calculation result by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the calculation result to retrieve.
 * @returns {Promise<Object|null>} - Calculation result document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneCalculationResult(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate _id input
    ValidateMongoObjectId(_id);

    // *************** get a single calculation result document
    const calculationResult = await CalculationResultModel.findOne({ _id, status: 'active' }).lean();
    if (!calculationResult) {
      throw new ApolloError("calculation result doesn't exist");
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneCalculationResult',
      path: '/modules/calculationResult/calculation_result.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADER ***************
/**
 * Resolve the student_id field in a calculation result document using DataLoader.
 * @async
 * @param {object} parent - The calculation result bject containing student_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.user - DataLoader instance for users.
 * @returns {Promise<Object|null>} - The student document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function student_id(parent, args, context) {
  try {
    // *************** check if student_id exist
    if (!parent.student_id) {
      return null;
    }
    // *************** load student
    const student = await context.loaders.student.load(parent.student_id);
    return student;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'student_id',
      path: '/modules/calculationResult/calculation_result.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllCalculationResults, GetOneCalculationResult },
  CalculationResult: {
    student_id,
  },
};
