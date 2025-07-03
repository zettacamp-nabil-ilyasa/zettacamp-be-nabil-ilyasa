// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Validates the user input object for required fields.
 * @param {Object} inputObject - The input object containing user data.
 * @param {string} inputObject.first_name - The user's first name.
 * @param {string} inputObject.last_name - The user's last name.
 * @param {string} inputObject.email - The user's email address.
 * @param {string[]} inputObject.role - Role assigned to the user.
 * @throws {ApolloError} - If any field is missing, has the wrong type, or fails validation.
 */
function ValidateUserInput(inputObject) {
  // *************** destructured input object
  let { first_name, last_name, email, role } = inputObject;

  // *************** validate user's email
  const userEmailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || email.trim() === '' || !userEmailRegexPattern.test(email))
    throw new ApolloError('email is required and must be in valid email format');

  // *************** validate user's first_name
  if (typeof first_name !== 'string' || first_name.trim() === '') throw new ApolloError('first_name is required');

  // *************** validate user's last_name
  if (typeof last_name !== 'string' || last_name.trim() === '') throw new ApolloError('last_name is required');

  // *************** validate user's role
  const validRoles = ['admin', 'operator'];
  if (typeof role !== 'string' || !validRoles.includes(role))
    throw new ApolloError('role is required and should be one of: ' + validRoles.join(', '));
}

// *************** EXPORT MODULES ***************
module.exports = { ValidateUserInput };
