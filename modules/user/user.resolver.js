// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { allowedRolesForGetAllUsers, allowedRolesForCreateUser, allowedRolesForDeleteUser } = require('../../shared/strings.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateCreateUserInput, ValidateUpdateUserInput, ValidateLoginInput, ValidateUniqueUserEmail } = require('./user.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** IMPORT HELPER ***************
const { GenerateToken, CompareHashedPassword, HashPassword } = require('./user.helper.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** QUERY ***************
/**
 * Get all active users from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of user documents with status 'active'.
 * @throws {ApolloError} - Throws error if database query fails.
 */
async function GetAllUsers(paginationInput, filterInput) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForGetAllUsers });

    // *************** validate pagination input
    ValidatePaginationInput(paginationInput);

    // *************** construct base query
    const query = { status: 'active' };

    // *************** add filter if it exist
    if (filterInput?.role) {
      query.role = filterInput.role;
    }

    // *************** set default value for page
    const page = paginationInput?.page ?? 1;

    // *************** set default value for limit
    const limit = paginationInput?.limit ?? 10;

    // *************** set how much documents skipped relative to page
    const skip = (page - 1) * limit;

    // *************** get total documents with status 'active' within UserModel
    const total_items = await UserModel.countDocuments(query);

    // *************** count total pages possible
    const total_pages = Math.ceil(total_items / limit);

    // *************** create empty object for sort
    const sort = {};

    // *************** extract sort_by from input
    const sortFieldMap = {
      name: 'name',
      created_at: 'created_at',
    };

    // *************** set default value for sortField
    const sortField = sortFieldMap[filterInput?.sort_by] || 'created_at';

    // *************** ensure that sort_order default value is 1 (ascending)
    const sortOrder = filterInput?.sort_order === 'desc' ? -1 : 1;

    // *************** set sort object using sort_ by and sort_order
    sort[sortField] = sortOrder;

    // *************** get users documents, apply filter, sorting, and pagination
    const users = await UserModel.find(query).sort(sort).skip(skip).limit(limit).lean();
    const pagedUsersData = {
      data: users,
      pagination_info: {
        page,
        limit,
        total_items,
        total_pages,
      },
    };
    return pagedUsersData;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllUsers',
      path: '/modules/user/user.resolver.js',
      parameter_input: JSON.stringify({ paginationInput, filterInput }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active user by ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the user to retrieve.
 * @returns {Promise<Object>} - The User document which match with _id.
 * @throws {ApolloError} - Throws error if validation fails or query error occurs.
 */
async function GetOneUser(parent, { _id }) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate user's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // *************** throw error if there's no user to return
    const user = await UserModel.findOne({ _id: _id, status: 'active' }).lean();
    if (!user) {
      throw new ApolloError('user not found or already deleted');
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
 * @throws {ApolloError} - Throws error if validation fails or email already exist.
 */
async function CreateUser(parent, { input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForCreateUser });

    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateCreateUserInput(input);

    // *************** check if email already used by another user
    await ValidateUniqueUserEmail(input.email);

    // *************** compose new object from input
    const newUser = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      role: input.role,
      created_by: context.user._id,
    };

    // *************** create user with composed object
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
 * Generata an access token for user, marked them as logged in.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Login input fields.
 * @param {string} input.email - User's email.
 * @param {string} input.password - User's password.
 * @returns {Promise<Object>} - User's data.
 * @throws {ApolloError} - Throws error if validation or jwt operation fails
 */
async function UserLogin(parent, { input }) {
  try {
    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateLoginInput(input);

    // *************** get user document
    const userDocument = UserModel.findOne({ email: input.email, status: 'active' });

    // *************** sanity check for userDocument
    if (!userDocument) {
      throw new ApolloError('invalid email or password');
    }

    // *************** compare inputed password with hashed password within user's document
    CompareHashedPassword({ passwordInput: input.password, hashedPassword: userDocument.password });

    // *************** generate an access_token for the user
    const loggedInUserData = GenerateToken(userDocument);
    return loggedInUserData;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UserLogin',
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
 * @throws {ApolloError} - Throws error if validation fails, user not found, or email already exist.
 */
async function UpdateUser(parent, { _id, input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate user's id
    ValidateMongoObjectId(_id);

    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateUpdateUserInput(input);

    // *************** get the user document
    const toBeUpdatedUserDocument = await UserModel.findOne({ _id, status: 'active' });

    // *************** sanity check for the user document
    if (!toBeUpdatedUserDocument) {
      throw new ApolloError('user does not exist');
    }

    // *************** check if email changed using the user document
    if (input.email !== toBeUpdatedUserDocument.email) {
      // *************** if email changed, also check if email already used by another user
      await ValidateUniqueUserEmail(input.email);
    }

    // *************** compose new object from input
    const editedUser = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      role: input.role,
      password: HashPassword(input.password),
      updated_by: context.user._id,
    };

    // *************** update user with composed object
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
async function DeleteUser(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForDeleteUser });

    // *************** validate user's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // *************** check if user is trying to delete themselves
    if (_id === context.user._id) {
      throw new ApolloError('You cannot delete yourself');
    }

    // *************** soft-delete user by updating it's status
    const deletedUser = await UserModel.updateOne(
      { _id, status: 'active' },
      { $set: { status: 'deleted', deleted_by: context.user._id, deleted_at: new Date() } }
    );

    // *************** check if the user is exist and not already deleted
    if (deletedUser.matchedCount === 0) {
      throw new ApolloError("user doesn't exist or already deleted");
    }
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

// *************** LOADER ***************
/**
 * Resolve the created_by field in a user object using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - Parent user object.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context that contains DataLoaders.
 * @returns {Promise<Object|null>} - The User document of the creator, or null if not available.
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
  Mutation: { CreateUser, UserLogin, UpdateUser, DeleteUser },
  User: {
    created_by,
  },
};
