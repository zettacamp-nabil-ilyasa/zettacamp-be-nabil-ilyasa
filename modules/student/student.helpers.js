// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTIL ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

/**
 * Check if a student email already exists in the database.
 * @async
 * @param {object} params - Input parameters.
 * @param {string} params.studentEmail - The email address to check.
 * @param {string} [params.studentId] - The ID of the student to exclude (optional).
 * @returns {Promise<boolean>} - True if the email exists, false otherwise.
 * @throws {ApolloError} - If input is invalid or DB query fails.
 */
async function StudentEmailIsExist({ studentEmail, studentId }) {
  try {
    if (!studentEmail) {
      throw new ApolloError('Invalid email input');
    }

    // *************** validate studentId if exist
    if (studentId) {
      ValidateId(studentId);
    }

    // *************** set query for db operation
    const query = { email: studentEmail };
    if (studentId) {
      query._id = { $ne: studentId };
    }

    const isEmailExist = Boolean(await StudentModel.exists(query));
    return isEmailExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'StudentEmailIsExist',
      path: '/modules/student/student.helpers.js',
      parameter_input: JSON.stringify({ studentEmail, studentId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Generate a bulk write query to move a student from one school to another.
 * @param {object} params - Input parameters.
 * @param {string} params.studentId - The student ID to move.
 * @param {string} params.newSchoolId - The ID of the new school.
 * @param {string} params.oldSchoolId - The ID of the old school.
 * @returns {Array<Object>} - Array of bulk write operations for MongoDB.
 * @throws {ApolloError} - If any ID is invalid.
 */
function GenerateBulkQueryForSchoolIdChange({ studentId, newSchoolId, oldSchoolId }) {
  // **************** validate ids
  ValidateId(studentId);
  ValidateId(newSchoolId);
  ValidateId(oldSchoolId);

  return [
    {
      // **************** remove student from current/old school's students field
      updateOne: { filter: { _id: oldSchoolId }, update: { $pull: { students: studentId } } },
    },
    // **************** add student to new school's students field
    {
      updateOne: { filter: { _id: newSchoolId }, update: { $addToSet: { students: studentId } } },
    },
  ];
}

// *************** EXPORT MODULE ***************
module.exports = {
  StudentEmailIsExist,
  GenerateBulkQueryForSchoolIdChange,
};
