// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const CalculationResultModel = require('./calculation_result.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { CalculateResult } = require('../calculationResult/calculation_result.helper.js');

// *************** QUERY ****************
/**
 * Get all calculation results from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of calculation results documents with active status.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllCalculationResults() {
  try {
    const calculationResults = await CalculationResultModel.find({ status: 'active' });
    return calculationResults;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllStudentTestResult',
      path: '/modules/calculationResult/calculation_result.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}
