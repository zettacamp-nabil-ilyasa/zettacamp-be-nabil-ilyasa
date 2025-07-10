// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SubjectModel = require('./subject.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Batch function to load multiple subjects by their IDs.
 * @async
 * @param {Array<string>} subjectIds - Array of subject IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of subject objects aligned with input IDs.
 * @throws {ApolloError} - If database query or processing fails.
 */
async function BatchSubjects(subjectIds) {
  try {
    // **************** validate each subject id
    subjectIds.forEach((subjectId) => {
      ValidateMongoObjectId(subjectId);
    });

    // **************** get all active subjects with id within subjectIds and status is active
    const subjects = await SubjectModel.find({ _id: { $in: subjectIds }, status: 'active' }).lean();

    // **************** set subjects data to dataMap
    const dataMap = new Map();
    subjects.forEach((subject) => {
      dataMap.set(String(subject._id), subject);
    });

    // **************** return array of subject objects with order of subjectIds
    return subjectIds.map((subjectId) => dataMap.get(String(subjectId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchSubjects',
      path: '/modules/subject/subject.loader.js',
      parameter_input: JSON.stringify({ subjectIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching subjects by subject IDs
 * @returns {DataLoader<string, Object>} - A DataLoader instance that loads subjects by subject ID
 */
function SubjectLoader() {
  return new DataLoader(BatchSubjects);
}

// *************** EXPORT MODULE ***************
module.exports = {
  SubjectLoader,
};
