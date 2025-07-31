// *************** IMPORT LIBRARY ***************
const jwt = require('jsonwebtoken');
const { ApolloError } = require('apollo-server-express');

function GenerateToken(userData) {
  // *************** check if env variable is provided
  if (!process.env.JWT_SECRET_KEY || !process.env.ACCESS_TOKEN_EXPIRE_TIME) {
    throw new ApolloError('missing required env: JWT_SECRET_KEY or ACCESS_TOKEN_EXPIRE_TIME');
  }

  // *************** user's email sanity check
  if (!userData._id) {
    throw new ApolloError("user's _id is required");
  }

  // *************** user's email sanity check
  if (!userData.email) {
    throw new ApolloError("user's email is required");
  }

  // *************** user's first_name sanity check
  if (!userData.first_name) {
    throw new ApolloError("user's first_name is required");
  }

  // *************** user's last_name sanity check
  if (!userData.last_name) {
    throw new ApolloError("user's last_name is required");
  }

  // *************** user's role sanity check
  if (!userData.role) {
    throw new ApolloError("user's role is required");
  }

  // *************** user's status sanity check
  if (!userData.status || userData.status !== 'active') {
    throw new ApolloError("user's status is required and should be 'active'");
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
}
