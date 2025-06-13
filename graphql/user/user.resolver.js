// *************** IMPORT MODULE ***************
const User = require('./user.model.js');

// *************** IMPORT UTILS ***************
const { CleanInputForUpdate } = require('../../utils/common.js');
const { CleanInputForCreate, IdIsValid } = require('../../utils/validator.js');

// *************** IMPORT HELPER ***************
const { ValidateUserCreateInput, ValidateUserUpdateInput, UserEmailIsExist, UserIsAdmin, UserIsExist } = require('../helper/helper.js');

//***************QUERY***************

/**
 * Get all active users from the database.
 * @returns {Promise<Array<Object>>} - Array of user documents or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllUsers() {
  try {
    const users = await User.find({ status: 'active' }).lean();
    return users;
  } catch (error) {
    throw new Error(error.message);
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
    const trimmedId = _id.trim();
    const isValidId = IdIsValid(trimmedId);
    if (!isValidId) {
      throw new Error('Invalid ID');
    }
    const user = await User.findOne({ _id: trimmedId, status: 'active' }).lean();
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
}

//**************MUTATION***************

/**
 * Create a new user after validating input and checking email existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User input fields.
 * @returns {Promise<Object>} - Created user document.
 * @throws {Error} - Throws error if validation fails or email already exists.
 */
async function CreateUser(_, { input }) {
  try {
    //**************** clean input from null, undefined and empty string
    cleanedInput = CleanInputForCreate(input);

    //**************** validate input
    const validatedUserInput = ValidateUserCreateInput(cleanedInput);
    const { email } = validatedUserInput;

    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist(email);
    if (emailIsExist) {
      throw new Error('Email already exist');
    }
    validatedUserInput.status = 'active';
    const createdUser = await User.create(validatedUserInput);
    return createdUser;
  } catch (error) {
    throw new Error(error.message);
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
    //**************** clean input from null, undefined and empty string
    cleanedInput = CleanInputForUpdate(input);

    //**************** validate input
    const validatedInput = ValidateUserUpdateInput(cleanedInput);
    const { _id, email } = validatedInput;

    //**************** check if user exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new Error('User does not exist');
    }
    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist(email, _id);
    if (emailIsExist) {
      throw new Error('Email already exist');
    }
    const updatedUser = await User.findOneAndUpdate({ _id: _id }, validatedInput, { new: true });
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
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
    //**************** trim id and deletedBy
    const trimmedDeletedId = _id.trim();
    const trimmedDeletedBy = deletedBy.trim();
    //**************** check if id inputed is valid
    const deletedIdIsValid = await IdIsValid(trimmedDeletedId);
    const deletedByIsValid = await IdIsValid(trimmedDeletedBy);
    if (!deletedIdIsValid || !deletedByIsValid) {
      throw new Error('Invalid ID');
    }
    //**************** check if user's role is admin
    const userIsAdmin = await UserIsAdmin(trimmedDeletedBy);
    if (!userIsAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if user exist
    const userIsExist = await UserIsExist(trimmedDeletedId);
    if (!userIsExist) {
      throw new Error('User does not exist');
    }

    await User.findOneAndUpdate({ _id: trimmedDeletedId }, { deleted_at: new Date(), status: 'deleted', deleted_by: trimmedDeletedBy });
    return 'User deleted successfully';
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Resolve the student field for a User by using DataLoader.
 * @param {object} parent - Parent, user object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function StudentFieldResolver(parent, _, context) {
  try {
    const userId = parent._id?.toString();
    const studentLoader = context.loaders.StudentByUserLoader.load(userId);
    return studentLoader;
  } catch (error) {
    throw new Error(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllUsers, GetOneUser },
  Mutation: { CreateUser, UpdateUser, DeleteUser },
  User: {
    student: StudentFieldResolver,
  },
};
