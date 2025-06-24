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
    //**************** validation to ensure bad input is handled correctly
    const validatedUserInput = ValidateUserCreateInput(input);
    const { created_by, email, password, first_name, last_name } = validatedUserInput;

    //**************** check if user to delete is exist and has admin role
    const userIsAdmin = await UserIsAdmin(created_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist({ userEmail: email });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    //**************** set password to hashed
    const hashedPassword = await HashPassword(password);

    //**************** compose new object with validated input for User
    const validatedUser = {
      email,
      password: hashedPassword,
      first_name,
      last_name,
      created_by,
    };

    //**************** create user with composed object
    const createdUser = await UserModel.create(validatedUser);
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
    //**************** validation to ensure bad input is handled correctly
    const validatedInput = ValidateUserUpdateInput(input);
    const { _id, email, first_name, last_name, password } = validatedInput;

    //**************** check if user exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }
    //**************** check if email already exist
    if (email) {
      const emailIsExist = await UserEmailIsExist({ userEmail: email, userId: _id });
      if (emailIsExist) {
        throw new ApolloError('Email already exist');
      }
    }
    //**************** compose new object with validated input
    const validatedUser = {};
    if (first_name) {
      validatedUser.first_name = first_name;
    }
    if (last_name) {
      validatedUser.last_name = last_name;
    }
    if (email) {
      validatedUser.email = email;
    }
    if (password) {
      const hashedPassword = await HashPassword(password);
      validatedUser.password = hashedPassword;
    }

    //**************** update user with composed object
    const updatedUser = await UserModel.findOneAndUpdate({ _id: _id }, validatedUser, { new: true });
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
    const validatedInput = ValidateEditRoleInput(input);
    const { updater_id, _id, role } = validatedInput;

    //**************** check if user has admin role
    const isAdmin = await UserIsAdmin(updater_id);
    if (!isAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if user already has the role
    const userHasRole = await UserHasRole({ userId: _id, role });
    if (userHasRole) {
      throw new ApolloError('User already has the role');
    }

    const updatedUser = await UserModel.findOneAndUpdate({ _id }, { $addToSet: { roles: role } }, { new: true });
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
    //**************** validate input
    const validatedInput = ValidateEditRoleInput(input);

    const { _id, updater_id, role } = validatedInput;

    //**************** check if user has admin role
    const isAdmin = await UserIsAdmin(updater_id);
    if (!isAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if user has the role
    const userHasRole = await UserHasRole({ userId: _id, role });
    if (!userHasRole) {
      throw new ApolloError('User does not have the role');
    }

    //**************** check if role can be removed
    const isRemovableRole = IsRemovableRole(role);
    if (!isRemovableRole) {
      throw new ApolloError('Role cannot be removed');
    }

    const updatedUser = await UserModel.findOneAndUpdate({ _id }, { $pull: { roles: role } }, { new: true }).lean();
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
    if (_id == deleted_by) {
      throw new ApolloError('You cannot delete yourself');
    }

    //**************** compose new object for soft delete
    const toBeDeletedUser = {
      deleted_at: new Date(),
      status: 'deleted',
      deleted_by: deleted_by,
    };

    //**************** soft-delete user by updating it with composed object
    await UserModel.updateOne({ _id: _id }, toBeDeletedUser);
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
    created_by: created_by,
  },
};
