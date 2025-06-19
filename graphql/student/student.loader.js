//*************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');

/**
 * Batch function to load students by array of student IDs
 * @param {Array<string>} studentIds - Array of student IDs
 * @returns {Promise<Array<Object|null>>} - Array of student objects or null if there's no student or student is deleted
 * @throws {Error} - Throws error if the database query fails
 */
async function BatchStudents(studentIds) {
  try {
    //**************** get all active students with id within studentIds and status is not deleted
    const students = await StudentModel.find({ _id: { $in: studentIds }, status: { $ne: 'deleted' } }).lean();

    //**************** set students data to dataMap
    const dataMap = new Map();
    students.forEach((student) => {
      dataMap.set(student._id.toString(), student);
    });

    //**************** return array of student objects with order of studentIds
    return studentIds.map((studentId) => dataMap.get(studentId.toString()));
  } catch (error) {
    throw new ApolloError(error.message);
  }
}

/**
 * create a new DataLoader instance for batching students by student IDs
 * @returns {DataLoader<string, Object|null>} A DataLoader instance that loads students by student ID
 */
function StudentLoader() {
  return new DataLoader(BatchStudents);
}

//*************** EXPORT MODULE ***************
module.exports = {
  StudentLoader,
};
