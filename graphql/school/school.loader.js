//*************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');

//*************** IMPORT UTIL ***************
const { LogErrorToDb } = require('../../utils/common.js');

/**
 * Batch function to load schools by array of school IDs
 * @param {Array<string>} schoolIds - Array of school IDs
 * @returns {Promise<Array<Object|null>>} - Array of school objects or null if there's no school or school is deleted
 */
async function BatchSchools(schoolIds) {
  try {
    //**************** get all active schools with id within schoolIds and status is not deleted
    const schools = await SchoolModel.find({ _id: { $in: schoolIds }, status: { $ne: 'deleted' } }).lean();

    //**************** set schools data to dataMap
    const dataMap = new Map();
    schools.forEach((school) => {
      dataMap.set(school._id.toString(), school);
    });
    //**************** return array of school objects with order of schoolIds
    return schoolIds.map((schoolId) => dataMap.get(schoolId.toString()));
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { schoolIds } });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching schools by school IDs
 * @returns {DataLoader<string, Object|null>} - A DataLoader instance that loads schools by school ID
 */
function SchoolLoader() {
  return new DataLoader(BatchSchools);
}

//*************** EXPORT MODULE ***************
module.exports = {
  SchoolLoader,
};
