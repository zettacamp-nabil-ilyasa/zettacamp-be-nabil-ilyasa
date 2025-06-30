// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTIL ***************
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

// *************** IMPORT VALIDATORS ***************
const { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput } = require('./user.validators.js');

// *************** IMPORT HELPERS ***************
const { UserIsExist, UserEmailIsExist, UserHasRole, IsRemovableRole } = require('./user.helpers.js');

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
    //**************** validate id
    ValidateId(_id);
    const user = await UserModel.findOne({ _id: _id, status: 'active' }).lean();
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

//************** MUTATION ***************
/**
 * Create a new user after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User input fields.
 * @param {string} args.input.email - Email address of the new user.
 * @param {string} args.input.first_name - First name of the new user.
 * @param {string} args.input.last_name - Last name of the new user.
 * @param {string} args.input.created_by - ID of the admin who creates this user.
 * @returns {Promise<Object>} - Created user document.
 * @throws {ApolloError} - Throws error if validation fails, user unauthorized, or email already exists.
 */
async function CreateUser(parent, { input }) {
  try {
    //**************** compose new object from input
    const newUser = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateUserCreateInput(newUser);

    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist({ userEmail: newUser.email });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    //**************** create user with composed object
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
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Fields to update in the user document.
 * @param {string} args.input._id - ID of the user to update.
 * @param {string} [args.input.email] - Updated email (optional).
 * @param {string} [args.input.first_name] - Updated first name (optional).
 * @param {string} [args.input.last_name] - Updated last name (optional).
 * @returns {Promise<Object>} - Updated user document.
 * @throws {ApolloError} - Throws error if validation fails, user not found, or email already exists.
 */
async function UpdateUser(parent, { input }) {
  try {
    //**************** compose new object from input
    let editedUser = {
      _id: input._id,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
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

    //**************** update user with composed object
    const updatedUser = await UserModel.findOneAndUpdate({ _id: editedUser._id }, { $set: editedUser }, { new: true }).lean();
    return updatedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateUser',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Add a new role to a user.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Fields to modify user roles.
 * @param {string} args.input._id - ID of the user to assign the role to.
 * @param {string} args.input.updater_id - ID of the admin who assigns the role.
 * @param {string} args.input.role - Role to be added (e.g. "admin", "editor").
 * @returns {Promise<Object>} - Updated user document.
 * @throws {ApolloError} - Throws error if validation fails, unauthorized, or user already has the role.
 */
async function AddRole(parent, { input }) {
  try {
    //**************** validate input
    const addedRoleForUser = {
      _id: input._id,
      role: typeof input.role === 'string' ? input.role.trim().toLowerCase() : input.role,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateEditRoleInput(addedRoleForUser);

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
    ).lean();
    return updatedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'AddRole',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Remove a role from a user.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Fields to modify user roles.
 * @param {string} args.input._id - ID of the user to remove the role from.
 * @param {string} args.input.updater_id - ID of the admin who removes the role.
 * @param {string} args.input.role - Role to be removed.
 * @returns {Promise<Object>} - Updated user document.
 * @throws {ApolloError} - Throws error if validation fails, unauthorized, role not found, or role is not removable.
 */
async function DeleteRole(parent, { input }) {
  try {
    //**************** compose new object from input
    const deletedRoleFromUser = {
      _id: input._id,
      role: typeof input.role === 'string' ? input.role.trim().toLowerCase() : input.role,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateEditRoleInput(deletedRoleFromUser);

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
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a user by updating their status to 'deleted'.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the user to delete.
 * @param {string} args.deleted_by - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, user not found, or attempt to self-delete.
 */
async function DeleteUser(parent, { _id }) {
  try {
    //**************** validate id
    ValidateId(_id);

    //**************** check if user to be deleted is exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** soft-delete user by updating it with composed object
    await UserModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_at: new Date() } });
    return 'User deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteUser',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id, deleted_by }),
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

// *************** EXPORT MODULES ***************
module.exports = {
  Query: { GetAllUsers, GetOneUser },
  Mutation: { CreateUser, UpdateUser, AddRole, DeleteRole, DeleteUser },
  User: {
    created_by,
  },
};
