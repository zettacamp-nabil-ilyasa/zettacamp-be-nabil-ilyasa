// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTILS ***************
const { HashPassword } = require('../../utils/common.js');
const { ValidateId, UserIsAdmin } = require('../../utils/common-validator.js');

// *************** IMPORT VALIDATORS ***************
const { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput } = require('./user.validators.js');

// *************** IMPORT HELPERS ***************
const { UserIsExist, UserEmailIsExist, UserHasRole, RoleIsValid, IsRemovableRole } = require('./user.helpers.js');

//*************** QUERY ***************

/**
 * Get all active users from the database.
 * @returns {Promise<Array<Object>>} - Array of user documents or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllUsers() {
  try {
    const users = await UserModel.find({ status: 'active' }).lean();
    return users;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllUsers',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active user by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The user document or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetOneUser(_, { _id }) {
  try {
    //**************** validate id
    ValidateId(_id);
    const user = await UserModel.findOne({ _id: _id, status: 'active' }).lean();
    return user;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneUser',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

//************** MUTATION ***************

/**
 * Create a new user after validating input and checking email existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User input fields.
 * @returns {Promise<Object>} - Created user document.
 * @throws {Error} - Throws error if validation or db operation fails.
 */
async function CreateUser(_, { input }) {
  try {
    //**************** compose new object from input
    let newUser = {
      email: input.email,
      password: input.password,
      first_name: input.first_name,
      last_name: input.last_name,
      created_by: input.created_by,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateUserCreateInput(newUser);

    //**************** check if user to delete is exist and has admin role
    const userIsAdmin = await UserIsAdmin(newUser.created_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist({ userEmail: newUser.email });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    //**************** set password to hashed and assign to newUser password field
    newUser.password = await HashPassword(newUser.password);

    //**************** create user with composed object
    const createdUser = await UserModel.create(newUser);
    return createdUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateUser',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a user after cleaning input, validating input, and checking existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User update fields.
 * @returns {Promise<Object>} - Updated user document.
 * @throws {Error} - Throws error if validation or db operation fails.
 */
async function UpdateUser(_, { input }) {
  try {
    //**************** compose new object from input
    let editedUser = {
      _id: input._id,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      password: input.password,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateUserUpdateInput(editedUser);

    //**************** check if user exist
    const userIsExist = await UserIsExist(editedUser._id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }
    //**************** check if email already exist
    if (editedUser.email) {
      const emailIsExist = await UserEmailIsExist({ userEmail: editedUser.email, userId: editedUser._id });
      if (emailIsExist) {
        throw new ApolloError('Email already exist');
      }
    }

    //**************** set password to hashed and assign to editedUser password field if provided
    if (editedUser.password) {
      editedUser.password = await HashPassword(editedUser.password);
    }

    //**************** update user with composed object
    const updatedUser = await UserModel.findOneAndUpdate({ _id: editedUser._id }, { $set: editedUser }, { new: true });
    return updatedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateUser',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Add a new role to a user.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User update fields.
 * @returns {Promise<Object>} - Updated user document.
 * @throws {Error} - Throws error if validation fails.
 */
async function AddRole(_, { input }) {
  try {
    //**************** validate input
    const addedRoleForUser = {
      _id: input._id,
      updater_id: input.updater_id,
      role: typeof input.role === 'string' ? input.role.trim().toLowerCase() : input.role,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateEditRoleInput(addedRoleForUser);

    //**************** check if user has admin role
    const isAdmin = await UserIsAdmin(addedRoleForUser.updater_id);
    if (!isAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(addedRoleForUser._id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if user already has the role
    const userHasRole = await UserHasRole({ userId: addedRoleForUser._id, role: addedRoleForUser.role });
    if (userHasRole) {
      throw new ApolloError('User already has the role');
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: addedRoleForUser._id },
      { $addToSet: { roles: addedRoleForUser.role } },
      { new: true }
    );
    return updatedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'AddRole',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Delete a role from a user.
 * @param {object} args - Resolver arguments
 * @param {object} args.input - User update fields.
 * @returns {Promise<Object>} - Updated user document.
 * @throws {Error} - Throws error if validation fails.
 */
async function DeleteRole(_, { input }) {
  try {
    //**************** compose new object from input
    const deletedRoleFromUser = {
      _id: input._id,
      updater_id: input.updater_id,
      role: typeof input.role === 'string' ? input.role.trim().toLowerCase() : input.role,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateEditRoleInput(deletedRoleFromUser);

    //**************** check if user has admin role
    const isAdmin = await UserIsAdmin(deletedRoleFromUser.updater_id);
    if (!isAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(deletedRoleFromUser._id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if user has the role
    const userHasRole = await UserHasRole({ userId: deletedRoleFromUser._id, role: deletedRoleFromUser.role });
    if (!userHasRole) {
      throw new ApolloError('User does not have the role');
    }

    //**************** check if role can be removed
    const isRemovableRole = IsRemovableRole(deletedRoleFromUser.role);
    if (!isRemovableRole) {
      throw new ApolloError('Role cannot be removed');
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: deletedRoleFromUser._id },
      { $pull: { roles: deletedRoleFromUser.role } },
      { new: true }
    ).lean();
    return updatedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteRole',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a user by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the user to delete.
 * @param {string} args.deletedBy - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or user not found.
 */
async function DeleteUser(_, { _id, deleted_by }) {
  try {
    //**************** valdiate id
    ValidateId(_id);
    ValidateId(deleted_by);

    //**************** check if deleter user is exist and has admin role
    const userIsAdmin = await UserIsAdmin(deleted_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user to be deleted is exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if user is trying to delete themselves
    if (_id === deleted_by) {
      throw new ApolloError('You cannot delete yourself');
    }

    //**************** soft-delete user by updating it with composed object
    await UserModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by, deleted_at: new Date() } });
    return 'User deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteUser',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id, deleted_by }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************

/**
 * Resolve the user field for by using DataLoader.
 * @param {object} parent - Parent, user object.
 * @param {object} context - Resolver context.
 * @returns {Promise<Object|null>} - The user document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function created_by(parent, _, context) {
  try {
    //*************** check if user has any created_by
    if (!parent?.created_by) {
      return null;
    }

    //*************** load user
    const loadedUser = await context.loaders.user.load(parent.created_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'created_by',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  Query: { GetAllUsers, GetOneUser },
  Mutation: { CreateUser, UpdateUser, AddRole, DeleteRole, DeleteUser },
  User: {
    created_by,
  },
};
