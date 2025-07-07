// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

/**
 * Validates the student input object for required fields and basic date formatting.
 * @param {Object} studentId - The id of student.
 * @param {Object} input - The input object containing student data.
 * @param {string} input.first_name - The first name of the student.
 * @param {string} input.last_name - The last name of the student.
 * @param {string} input.email - The email address of the student.
 * @param {string} input.date_of_birth - The student's date of birth in string format (YYYY-MM-DD).
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateStudentInput(input) {
  // *************** destructured input object
  let { first_name, last_name, email, date_of_birth } = input;

  // *************** validate student's email
  const studentEmailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !studentEmailRegexPattern.test(email))
    throw new ApolloError('email is required and must be in valid email format');

  // *************** validate student's first_name
  if (!first_name || typeof first_name !== 'string') throw new ApolloError('first_name is required');

  // *************** validate student's last_name
  if (!last_name || typeof last_name !== 'string') throw new ApolloError('last_name is required');

  // *************** validate student's date_of_birth existence
  if (!date_of_birth || typeof date_of_birth !== 'string') throw new ApolloError('date_of_birth is required');

  // *************** validate student's date_of_birth format
  const dateOfBirthRegexPatern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!dateOfBirthRegexPatern.test(date_of_birth)) throw new ApolloError('date_of_birth must be in YYYY-MM-DD format');

  // *************** student's date_of_birth can't be earlier than 1900 and can't be in the future
  const parsedDate = new Date(date_of_birth);
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 1900 || parsedDate.getTime() > Date.now()) {
    throw new ApolloError('date_of_birth should not be earlier than 1900 and not in the future');
  }
}

/**
 * Check if a student email already exists in the database.
 * @async
 * @param {string} studentEmail - The email address to check.
 * @throws {ApolloError} - If input is invalid or DB query fails.
 */
async function ValidateUniqueStudentEmail(studentEmail) {
  try {
    // *************** validate studentEmail input
    if (!studentEmail) {
      throw new ApolloError('email is required');
    }

    // *************** find the student with studentEmail
    const emailIsExist = await StudentModel.findOne({ email: studentEmail.trim().toLowerCase() }).lean();

    // *************** throw error if email is already exist
    if (emailIsExist) {
      throw new ApolloError('email already used by another student');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'ValidateUniqueStudentEmail',
      path: '/modules/student/student.validators.js',
      parameter_input: JSON.stringify({ studentEmail }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateStudentInput, ValidateUniqueStudentEmail };
