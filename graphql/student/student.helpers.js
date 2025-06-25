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
    //*************** validate studentId
    ValidateId(studentId);

    //*************** set query for db operation
    const query = { _id: studentId, status: 'active' };

    const isStudentExist = Boolean(await StudentModel.exists(query));
    return isStudentExist;
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
 * @param {string} studentEmail - The email to be checked.
 * @param {string} studentId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function StudentEmailIsExist({ studentEmail, studentId }) {
  try {
    if (!studentEmail) {
      throw new ApolloError('Invalid email input');
    }

    //*************** validate studentId if exist
    if (studentId) {
      ValidateId(studentId);
    }

    //*************** set query for db operation
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
      path: '/graphql/student/student.helpers.js',
      parameter_input: JSON.stringify({ studentEmail, studentId }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get the previous school id of a student if there's any.
 * @param {string} studentId - Student id to be checked.
 * @returns {promise<string>} - The previous school id.
 * @throws {Error} - If failed in validation or db operation.
 */
async function GetStudentCurrentSchoolId(studentId) {
  try {
    //*************** validate id
    ValidateId(studentId);

    const student = await StudentModel.findOne({ _id: studentId }).lean();
    if (!student) {
      throw new ApolloError('Student does not exist');
    }

    return student.school_id;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetStudentCurrentSchoolId',
      path: '/graphql/student/student.helpers.js',
      parameter_input: JSON.stringify(studentId),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************

module.exports = {
  StudentIsExist,
  StudentEmailIsExist,
  GetStudentCurrentSchoolId,
};
