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
 * Compare input password with hashed password
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

/**
 * Build MongoDB aggregation pipeline for User queries with pagination, sorting, and filtering.
 * @param {Object} params - Parameters for building the aggregation pipeline.
 * @param {number} params.skip - Number of documents to skip (for pagination).
 * @param {number} params.limit - Maximum number of documents to return (for pagination).
 * @param {Object} [params.filterInput] - Filtering options for the query.
 * @param {Object} [params.sortInput] - Sorting options for the query.
 *@throws {ApolloError} If required parameters are missing or invalid.
 * @returns {Array<Object>} MongoDB aggregation pipeline stages.
 */
function UserAggregatePipelineQueryBuilder({ skip, limit, filterInput, sortInput }) {
  // *************** sanity check for all of input object parameter
  if (typeof skip !== 'number') throw new ApolloError('skip is required and must be a number');
  if (!limit || typeof limit !== 'number') throw new ApolloError('limit is required and must be a number');
  if (filterInput && typeof filterInput !== 'object') throw new ApolloError('filterInput is required and must be an object');

  // *************** map sort options
  const sortOption = {};
  const sortFieldMap = {
    first_name: 'first_name',
    last_name: 'last_name',
    created_at: 'created_at',
  };
  // *************** set default value for sortField
  const sortField = sortFieldMap[sortInput?.sort_by] || 'created_at';

  // *************** ensure that sort_order default value is 1 (ascending)
  const sortOrder = sortInput?.sort_order === 'desc' ? -1 : 1;

  // *************** set sort object using sort_ by and sort_order
  sortOption[sortField] = sortOrder;

  const pipeline = [];

  // *************** match stage query
  const schoolMatchStage = { status: 'active' };
  if (filterInput?.role) {
    schoolMatchStage.role = filterInput.role;
    pipeline.push({ $match: schoolMatchStage });
  }

  // *************** apply facet for pagination
  pipeline.push({
    $facet: {
      data: [{ $sort: sortOption }, { $skip: skip }, { $limit: limit }],
      total_count: [{ $count: 'count' }],
    },
  });
  return pipeline;
}

// *************** EXPORT MODULE ***************
module.exports = { GenerateToken, HashPassword, CompareHashedPassword, UserAggregatePipelineQueryBuilder };
