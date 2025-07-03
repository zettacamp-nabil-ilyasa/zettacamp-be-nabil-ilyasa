// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const StudentModel = require('./student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

/**
 * Batch function to load multiple students by their IDs.
 * @param {Array<string>} studentIds - Array of student IDs to fetch.
 * @returns {Promise<Array<Object>>} - Array of student objects aligned with input IDs.
 * @throws {ApolloError} - If database query fails.
 */
async function BatchStudents(studentIds) {
  try {
    // **************** get all active students with id within studentIds and status is not deleted
    const students = await StudentModel.find({ _id: { $in: studentIds }, status: 'active' }).lean();

    // **************** set students data to dataMap
    const dataMap = new Map();
    students.forEach((student) => {
      dataMap.set(String(student._id), student);
    });

    // **************** return array of student objects with order of studentIds
    return studentIds.map((studentId) => dataMap.get(String(studentId)));
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'BatchStudents',
      path: '/modules/student/student.loader.js',
      parameter_input: JSON.stringify({ studentIds }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * create a new DataLoader instance for batching students by student IDs.
 * @returns {DataLoader<string, Object} A DataLoader instance that loads students by student ID.
 */
function StudentLoader() {
  return new DataLoader(BatchStudents);
}

// *************** EXPORT MODULE ***************
module.exports = {
  StudentLoader,
};
