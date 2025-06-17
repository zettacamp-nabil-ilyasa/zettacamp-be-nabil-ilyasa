//*************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

//*************** IMPORT MODULE ***************
const School = require('./school.model.js');

/**
 * Batch function to load schools by array of school IDs
 * @param {Array<string>} schoolIds - Array of school IDs
 * @returns {Promise<Array<Object|null>>} - Array of school objects or null if there's no school or school is deleted
 */
async function BatchSchools(schoolIds) {
  try {
    const schools = await School.find({ _id: { $in: schoolIds }, status: { $ne: 'deleted' } }).lean();
    const dataMap = new Map();
    schools.forEach((school) => {
      dataMap.set(school._id.toString(), school);
    });
    return schoolIds.map((schoolId) => dataMap.get(schoolId.toString()));
  } catch (error) {
    throw new Error(error.message);
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
