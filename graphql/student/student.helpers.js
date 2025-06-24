//*************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

//*************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

//*************** IMPORT UTIL ***************
const { ValidateId } = require('../../utils/common-validator.js');

/**
 * Check if a Student with the given ID already exists.
 * @param {string} studentId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 * @throws {Error} - If failed sanity check or db operation.
 */
async function StudentIsExist(studentId) {
  try {
    //*************** studentId input check
    ValidateId(studentId);

    //*************** set query for db operation
    const query = { _id: studentId, status: 'active' };

    const studentIsExist = await Boolean(StudentModel.exists(query));
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
 * @param {string} email - The email to be checked.
 * @param {string} _id - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function StudentEmailIsExist({ email, _id = null }) {
  try {
    if (!email) {
      throw new ApolloError('Invalid email input');
    }

    //*************** _id input check
    if (_id) {
      ValidateId(_id);
    }

    //*************** set query for db operation
    const query = { email };
    if (_id) {
      query._id = { $ne: _id };
    }

    const emailIsExist = Boolean(await StudentModel.exists(query));
    return emailIsExist;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'StudentEmailIsExist',
      path: '/graphql/student/student.helpers.js',
      parameter_input: JSON.stringify({ email, _id }),
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
    ValidateId(studentId);

    const student = await StudentModel.findById(studentId);
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
