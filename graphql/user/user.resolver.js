// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTILS ***************
const { HashPassword } = require('../../utils/common.js');
const { SanitizeAndValidateId, UserIsAdmin } = require('../../utils/common-validator.js');

// *************** IMPORT VALIDATORS ***************
const { ValidateUserCreateInput, ValidateUserUpdateInput, ValidateEditRoleInput } = require('./user.validators.js');

// *************** IMPORT HELPERS ***************
const {
  UserIsExist,
  UserEmailIsExist,
  UserHasRole,
  NormalizeRole,
  IsRemovableRole,
  UserIsReferencedByStudent,
} = require('./user.helpers.js');

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
    //**************** sanitize and validate id
    const validId = SanitizeAndValidateId(_id);
    const user = await UserModel.findOne({ _id: validId, status: 'active' }).lean();
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
 * @throws {Error} - Throws error if validation fails or email already exists.
 */
async function CreateUser(_, { input }) {
  try {
    //**************** validation to ensure input is formatted correctly and
    const validatedUserInput = ValidateUserCreateInput(input);
    const { created_by, email, password, first_name, last_name } = validatedUserInput;

    //**************** check if user to delete is exist and has admin role
    const userIsAdmin = await UserIsAdmin(created_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist(email);
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
 * @throws {Error} - Throws error if validation fails or user/email conflict.
 */
async function UpdateUser(_, { input }) {
  try {
    //**************** validation to ensure input is formatted correctly
    const validatedInput = ValidateUserUpdateInput(input);
    const { _id, email, first_name, last_name, password } = validatedInput;

    //**************** check if user exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }
    //**************** check if email already exist
    if (email) {
      const emailIsExist = await UserEmailIsExist(email, _id);
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

    //**************** update user with validated input
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
    //**************** validate input fields
    const validatedInput = ValidateEditRoleInput(input);
    const { updater_id, _id, role } = validatedInput;

    //**************** check if user's role is admin
    const isAdmin = await UserIsAdmin(updater_id);
    if (!isAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if role is valid
    const normalizedRole = NormalizeRole(role);

    //**************** check if user already has the role
    const userHasRole = await UserHasRole(_id, normalizedRole);
    if (userHasRole) {
      throw new ApolloError('User already has the role');
    }

    const updatedUser = await UserModel.findOneAndUpdate({ _id }, { $addToSet: { roles: normalizedRole } }, { new: true });
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
    //**************** validate input fields
    const validatedInput = ValidateEditRoleInput(input);

    const { _id, updater_id, role } = validatedInput;

    //**************** check if user's role is admin
    const isAdmin = await UserIsAdmin(updater_id);
    if (!isAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if role is valid and normalized it
    const normalizedRole = NormalizeRole(role);

    //**************** check if user has the role
    const userHasRole = await UserHasRole(_id, normalizedRole);
    if (!userHasRole) {
      throw new ApolloError('User does not have the role');
    }

    //**************** check if role can be removed
    const isRemovableRole = IsRemovableRole(normalizedRole);
    if (!isRemovableRole) {
      throw new ApolloError('Role cannot be removed');
    }

    const updatedUser = await UserModel.findOneAndUpdate({ _id }, { $pull: { roles: normalizedRole } }, { new: true }).lean();
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
async function DeleteUser(_, { _id, deletedBy }) {
  try {
    //**************** sanitize and validate id and deletedBy
    const validDeletedId = SanitizeAndValidateId(_id);
    const validDeletedBy = SanitizeAndValidateId(deletedBy);

    //**************** check if deleter user is exist and has admin role
    const userIsAdmin = await UserIsAdmin(validDeletedBy);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if user to be deleted is exist
    const userIsExist = await UserIsExist(validDeletedId);
    if (!userIsExist) {
      throw new ApolloError('User does not exist');
    }

    //**************** check if user is trying to delete themselves
    if (_id == deletedBy) {
      throw new ApolloError('You cannot delete yourself');
    }

    //**************** check if user is referenced by any student
    const userIsReferenced = await UserIsReferencedByStudent(validDeletedId);
    if (userIsReferenced) {
      throw new ApolloError('User that is referenced by a student cannot be deleted');
    }

    const toBeDeletedUser = {
      deleted_at: new Date(),
      status: 'deleted',
      deleted_by: validDeletedBy,
    };
    //**************** soft-delete user by marking their status as 'deleted' and set deleted_at
    await UserModel.updateOne({ _id: validDeletedId }, toBeDeletedUser);
    return 'User deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteUser',
      path: '/graphql/user/user.resolver.js',
      parameter_input: JSON.stringify({ _id, deletedBy }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADER ***************

/**
 * Resolve the user field for by using DataLoader.
 * @param {object} parent - Parent, user object.
 * @param {object} context - Resolver context.
 * @returns {Promise<Object|null>} - The user document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function Created_By(parent, _, context) {
  try {
    //*************** check if user has any school
    if (!parent?.created_by) {
      return null;
    }

    //*************** load user
    const loadedUser = await context.loaders.user.load(parent.created_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'Created_By',
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
    created_by: Created_By,
  },
};
