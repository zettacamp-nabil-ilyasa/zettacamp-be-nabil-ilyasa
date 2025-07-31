// *************** IMPORT LIBRARY ***************
const jwt = require('jsonwebtoken');
const { ApolloError } = require('apollo-server-express');
const Bcrypt = require('bcrypt');

// *************** IMPORT MODULE ***************
const ErrorLogModel = require('../errorLog/error_log.model');

/**
 * Generate jwt token for provided user data
 * @param {Object} userData - User's object passed from login mutation
 * @returns {Object} - Containing user's data and access_token
 */
async function GenerateToken(userData) {
  try {
    // *************** check if env variable is provided
    if (!process.env.JWT_SECRET_KEY || !process.env.ACCESS_TOKEN_EXPIRE_TIME) {
      throw new ApolloError('missing required env: JWT_SECRET_KEY or ACCESS_TOKEN_EXPIRE_TIME');
    }

    // *************** sanity check for the userData object
    if (typeof userData !== 'object') {
      throw new ApolloError('userData must be a plain object');
    }

    // *************** compose payload for jwt token from userData
    const jwtPayload = {
      _id: userData._id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      role: userData.role,
      status: userData.status,
    };

    // *************** generate jwt token
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME });
    const returnedUserData = { ...jwtPayload, access_token: jwtToken };
    return returnedUserData;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GenerateToken',
      path: '/modules/user/user.helper.js',
      parameter_input: JSON.stringify({ userData }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Extract data from jwt token get from headers
 * @param {Object} headers - Headers of request containing authorization field
 * @returns {Object} - Extracted data from
 */
async function GetUserFromHeader(headers) {
  try {
    // *************** get token from header object
    const authHeader = headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApolloError('auth header is missing or invalid');
    }

    // *************** split authHeader, get token only
    const jwtToken = authHeader.split(' ')[1];

    // *************** extract user data from verified jwtToken
    const decodedJwtToken = jwt.decode(jwt.verify(jwtToken));
    return decodedJwtToken;
  } catch (error) {
    return null;
  }
}

/**
 * Hash a password, add security to user's password.
 * @param {String} passwordString - password that want to be hashed.
 * @returns {String} - The hashed password.
 */
function HashPassword(passwordString) {
  // *************** sanity check for passwordString
  if (!passwordString) {
    throw new ApolloError('string of password is required');
  }

  // *************** define how many round should bcrypt hashing do
  const saltRound = 11;

  // *************** hashed the passwordString
  const hashedPassword = Bcrypt.hash(passwordString, saltRound);
  return hashedPassword;
}

/**
 *
 * @param {String} passwordInput - String of password.
 * @param {String} hashedPassword - Encrypted/hashed password to be compared to.
 * @throws {ApolloError} - If sanity check or comparation fail.
 */
function CompareHashedPassword({ passwordInput, hashedPassword }) {
  // *************** sanity check for input passsword
  if (!passwordInput) {
    throw new ApolloError('passwordInput is required');
  }

  // *************** sanity check for the hashedPassword
  if (!hashedPassword) {
    throw new ApolloError('hashedPassword is required');
  }

  const passwordIsMatched = Bcrypt.compare(passwordInput, hashedPassword);
  if (!passwordIsMatched) {
    throw new ApolloError('invalid username or password');
  }
}

// *************** EXPORT MODULE ***************
module.exports = { GenerateToken, GetUserFromHeader, HashPassword, CompareHashedPassword };
