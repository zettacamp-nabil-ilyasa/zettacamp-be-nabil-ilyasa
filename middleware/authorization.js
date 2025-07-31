// *************** IMPORT LIBRARY ***************
const { AuthenticationError, ForbiddenError, ApolloError } = require('apollo-server-express');

/**
 * Middleware function to prevent access from unauthorized user
 * @param {object} userData - User's data passed from context
 * @param {Array<String>} allowedRoles - Array containing roles.
 * @throws {ApolloError} - Throws error if userData is not provided or mismatch of role
 */
function UserIsAuthorized({ userData, allowedRoles }) {
  // *************** check if user is authenticated by checking user data provided from context
  if (!userData || !userData.role) {
    throw new AuthenticationError('unauthorized access');
  }

  // *************** check for roles if allowedRoles provided
  if (allowedRoles) {
    // *************** ensure allowedRoles is an array
    if (!Array.isArray(allowedRoles)) {
      throw new ApolloError('allowedRoles must be an array');
    }
    // *************** check if user's role is one of the allowed roles within allowedRoles
    if (!allowedRoles.includes(userData.role)) {
      throw new ForbiddenError("you don't have neccesarry role");
    }
  }
}

// *************** EXPORT MODULE ***************
module.exports = { UserIsAuthorized };
