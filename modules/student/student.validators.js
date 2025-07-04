// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validates the student input object for required fields and basic date formatting.
 * @param {Object} inputObject - The input object containing student data.
 * @param {string} inputObject.first_name - The first name of the student.
 * @param {string} inputObject.last_name - The last name of the student.
 * @param {string} inputObject.email - The email address of the student.
 * @param {string} inputObject.date_of_birth - The student's date of birth in string format (YYYY-MM-DD).
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateStudentInput(inputObject) {
  // *************** destructured input object
  let { first_name, last_name, email, date_of_birth } = inputObject;

  // *************** validate student's email
  const studentEmailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || email.trim() === '' || !studentEmailRegexPattern.test(email))
    throw new ApolloError('email is required and must be in valid email format');

  // *************** validate student's first_name
  if (typeof first_name !== 'string' || first_name.trim() === '') throw new ApolloError('first_name is required');

  // *************** validate student's last_name
  if (typeof last_name !== 'string' || last_name.trim() === '') throw new ApolloError('last_name is required');

  // *************** validate student's date_of_birth
  if (typeof date_of_birth !== 'string' || date_of_birth.trim() === '') throw new ApolloError('date_of_birth is required');
  const parsedDate = date_of_birth instanceof Date ? date_of_birth : new Date(date_of_birth);
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 1900 || parsedDate.getTime() > Date.now())
    throw new ApolloError('date_of_birth should be in YYYY-MM-DD, not earlier than 1900, and not in the future');
}

/**
 * Check if a student email already exists in the database.
 * @async
 * @param {object} params - Input parameters.
 * @param {string} params.studentEmail - The email address to check.
 * @param {string} [params.studentId] - The ID of the student to exclude (optional).
 * @returns {Promise<Object|null>} - The Student object if found, otherwise null.
 * @throws {ApolloError} - If input is invalid or DB query fails.
 */
async function ValidateUniqueStudentEmail({ studentEmail, studentId }) {
  try {
    // *************** validate studentEmail input
    if (!studentEmail) {
      throw new ApolloError('email is required');
    }

    // *************** set basequery for db operation
    const query = { email: studentEmail.trim().toLowerCase() };

    // *************** studentId used for update, to exclude the to be updated student from checking
    if (studentId) {
      ValidateId(studentId);
      query._id = { $ne: studentId };
    }

    const emailIsExist = await StudentModel.findOne(query).lean();

    // *************** throw error if email is already exist
    if (emailIsExist) {
      throw new ApolloError('email already used by another student');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'ValidateUniqueStudentEmail',
      path: '/modules/student/student.validators.js',
      parameter_input: JSON.stringify({ studentEmail, studentId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateStudentInput, ValidateUniqueStudentEmail };
