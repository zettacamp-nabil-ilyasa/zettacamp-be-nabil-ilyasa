// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateUserInput, UserIsExist, UserEmailIsExist } = require('./user.validators.js');
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

// *************** QUERY ***************
/**
 * Get all active users from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of user documents with status 'active'.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllUsers() {
  try {
    const users = await UserModel.find({ status: 'active' }).lean();
    return users;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllUsers',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active user by ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The user document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or query error occurs.
 */
async function GetOneUser(parent, { _id }) {
  try {
    // **************** validate user's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    // **************** throw error if there's no student to returned
    const user = await UserModel.findOne({ _id: _id, status: 'active' }).lean();
    if (!user) {
      throw new ApolloError('cannot get the requested user');
    }
    return user;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneUser',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** MUTATION ***************
/**
 * Create a new user after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - User input fields.
 * @param {string} input.email - Email address of the new user.
 * @param {string} input.first_name - First name of the new user.
 * @param {string} input.last_name - Last name of the new user.
 * @param {string} input.role - Role of the new user.
 * @param {string} input.created_by - ID of the admin who creates this user.
 * @returns {Promise<Object>} - Created user document.
 * @throws {ApolloError} - Throws error if validation fails, user unauthorized, or email already exists.
 */
async function CreateUser(parent, { input }) {
  try {
    // **************** validation to ensure fail-fast and bad input is handled correctly
    ValidateUserInput(input);

    // **************** check if email already used by another user
    const emailIsExist = await UserEmailIsExist({ userEmail: input.email.trim().toLowerCase() });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    // **************** compose new object from input, sets static created_by
    const newUser = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      role: input.role,
    };

    // *************** set static User id for created_by field
    const createdByUserId = '6862150331861f37e4e3d209';
    newUser.created_by = createdByUserId;

    // **************** create user with composed object
    const createdUser = await UserModel.create(newUser);
    return createdUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateUser',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a user document after validating input and checking user existence.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Fields to update in the user document.
 * @param {string} input._id - ID of the user to update.
 * @param {string} input.email - Updated email.
 * @param {string} input.first_name - Updated first name.
 * @param {string} input.last_name - Updated last name.
 * @param {string} input.role - Updated role.
 * @returns {Promise<Object>} - Updated user document.
 * @throws {ApolloError} - Throws error if validation fails, user not found, or email already exists.
 */
async function UpdateUser(parent, { _id, input }) {
  try {
    // **************** validate _id
    ValidateId(_id);

    // **************** validation to ensure fail-fast and bad input is handled correctly
    ValidateUserInput(input);

    // **************** check if user exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    // **************** check if email already used by another user
    const emailIsExist = await UserEmailIsExist({ userId: _id, userEmail: input.email.trim().toLowerCase() });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    // **************** compose new object from input
    const editedUser = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      role: input.role,
    };

    // **************** update user with composed object
    const updatedUser = await UserModel.findOneAndUpdate({ _id }, { $set: editedUser }, { new: true }).lean();
    return updatedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateUser',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a user by updating their status to 'deleted'.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the user to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, user not found, or attempt to self-delete.
 */
async function DeleteUser(parent, { _id }) {
  try {
    // **************** validate user's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    // **************** check if user to be deleted is exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist or already deleted');
    }

    // **************** set static deleted_by
    const deletedByUserId = '6862150331861f37e4e3d209';

    // **************** check if user is trying to delete themselves
    if (_id === deletedByUserId) {
      throw new ApolloError('You cannot delete yourself');
    }

    // **************** soft-delete user by updating it's status
    await UserModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by: deletedByUserId, deleted_at: new Date() } });
    return 'User deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteUser',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the created_by field in a user object using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - Parent user object.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context that contains DataLoaders.
 * @returns {Promise<Object|null>} - The user document of the creator, or null if not available.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function created_by(parent, args, context) {
  try {
    // *************** check if user has any created_by
    if (!parent?.created_by) {
      return null;
    }

    // *************** load user
    const loadedUser = await context.loaders.user.load(parent.created_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'created_by',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllUsers, GetOneUser },
  Mutation: { CreateUser, UpdateUser, DeleteUser },
  User: {
    created_by,
  },
};
