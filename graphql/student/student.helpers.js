//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

//*************** IMPORT UTIL ***************
const { SanitizeAndValidateId } = require('../../utils/common-validator.js');

/**
 * Check if a Student with the given ID already exists.
 * @param {string} studentId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed sanity check or db operation.
 */
async function StudentIsExist(studentId) {
  try {
    //*************** studentId input check
    const validatedStudentId = SanitizeAndValidateId(studentId);

    //*************** set query for db operation
    const query = { _id: validatedStudentId, status: 'active' };

    const count = await StudentModel.countDocuments(query);
    const studentIsExist = count > 0;
    return studentIsExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'StudentIsExist',
      path: '/graphql/student/student.helpers.js',
      parameter_input: JSON.stringify({ studentId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Check if student email already exist
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function StudentEmailIsExist({ emailAcc, excludeId = null }) {
  try {
    //*************** emailAcc input check
    if (typeof emailAcc !== 'string') {
      throw new ApolloError('Invalid email input');
    }
    const trimmedEmail = emailAcc.trim();
    if (trimmedEmail === '') {
      throw new ApolloError('Invalid email input');
    }

    //*************** excludeId input check
    let validatedExcludeId = '';
    if (excludeId) {
      validatedExcludeId = SanitizeAndValidateId(excludeId);
    }

    //*************** set query for db operation
    const query = { email: trimmedEmail };
    if (excludeId) {
      query._id = { $ne: validatedExcludeId };
    }

    const count = await StudentModel.countDocuments(query);
    const studentEmailIsExist = count > 0;
    return studentEmailIsExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'StudentEmailIsExist',
      path: '/graphql/student/student.helpers.js',
      parameter_input: JSON.stringify({ emailAcc, excludeId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get the previous school id of a student if there's any.
 * @param {string} studentId - Student id to be checked.
 * @returns {promise<string>||null} - The previous school id or null if there's none.
 */
async function GetPreviousSchoolId(studentId) {
  try {
    //*************** validate id input
    const validatedStudentId = SanitizeAndValidateId(studentId);

    const student = await StudentModel.findById(validatedStudentId);
    if (!student) {
      return null;
    }
    return student.school_id;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetPreviousSchoolId',
      path: '/graphql/student/student.helpers.js',
      parameter_input: JSON.stringify({ studentId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************

module.exports = {
  StudentIsExist,
  StudentEmailIsExist,
  GetPreviousSchoolId,
};
