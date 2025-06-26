// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

/**
 * Batch function to load multiple schools by their IDs.
 * @param {Array<string>} schoolIds - Array of school IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of school objects aligned with input IDs.
 * @throws {ApolloError} - If database query or processing fails.
 */

async function BatchSchools(schoolIds) {
  try {
    //**************** get all active schools with id within schoolIds and status is not deleted
    const schools = await SchoolModel.find({ _id: { $in: schoolIds }, status: 'active' }).lean();

    //**************** set schools data to dataMap
    const dataMap = new Map();
    schools.forEach((school) => {
      dataMap.set(String(school._id), school);
    });
    //**************** return array of school objects with order of schoolIds
    return schoolIds.map((schoolId) => dataMap.get(String(schoolId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchSchools',
      path: '/modules/school/school.loader.js',
      parameter_input: JSON.stringify({ schoolIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching schools by school IDs
 * @returns {DataLoader<string, Object} - A DataLoader instance that loads schools by school ID
 */
function SchoolLoader() {
  return new DataLoader(BatchSchools);
}

// *************** EXPORT MODULE ***************
module.exports = {
  SchoolLoader,
};
