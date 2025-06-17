// *************** IMPORT MODULE ***************
const User = require('./user.model.js');

// *************** IMPORT UTILS ***************
const { CleanNonRequiredInput, UserEmailIsExist } = require('../../utils/common.js');
const { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin } = require('../../utils/validator.js');

// *************** IMPORT HELPER ***************
const {
  ValidateUserCreateInput,
  ValidateUserUpdateInput,
  UserIsExist,
  UserHasRole,
  NormalizeRole,
  IsRemovableRole,
  HashPassword,
  UserIsReferencedByStudent,
} = require('./user.helper.js');

//*************** QUERY ***************

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
    //**************** sanitize and validate id
    const validId = SanitizeAndValidateId(_id);
    const user = await User.findOne({ _id: validId, status: 'active' }).lean();
    return user;
  } catch (error) {
    throw new Error(error.message);
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
    //**************** clean input from null, undefined and empty string
    const cleanedInput = CleanRequiredInput(input);

    //**************** validate input
    const validatedUserInput = ValidateUserCreateInput(cleanedInput);
    const { email } = validatedUserInput;

    //**************** check if email already exist
    const emailIsExist = await UserEmailIsExist(email);
    if (emailIsExist) {
      throw new Error('Email already exist');
    }
    validatedUserInput.status = 'active';
    validatedUserInput.roles = 'user';
    validatedUserInput.password = await HashPassword(validatedUserInput.password);
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
    const cleanedInput = CleanNonRequiredInput(input);

    //**************** validate input
    const validatedInput = ValidateUserUpdateInput(cleanedInput);
    const { _id, email } = validatedInput;

    //**************** check if user exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new Error('User does not exist');
    }
    //**************** check if email already exist
    if (email) {
      const emailIsExist = await UserEmailIsExist(email, _id);
      if (emailIsExist) {
        throw new Error('Email already exist');
      }
    }
    const updatedUser = await User.findOneAndUpdate({ _id: _id }, validatedInput, { new: true });
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function AddRole(_, { input }) {
  try {
    //**************** clean input from null, undefined and empty string
    const cleanedInput = CleanRequiredInput(input);

    const { updaterId, _id, role } = cleanedInput;

    //**************** check if user's role is admin
    const isAdmin = await UserIsAdmin(updaterId);
    if (!isAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new Error('User does not exist');
    }

    //**************** check if role is valid
    const normalizedRole = NormalizeRole(role);

    //**************** check if user already has the role
    const userHasRole = await UserHasRole(_id, normalizedRole);
    if (userHasRole) {
      throw new Error('User already has the role');
    }

    const updatedUser = await User.findOneAndUpdate({ _id }, { $addToSet: { roles: normalizedRole } }, { new: true });
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function DeleteRole(_, { input }) {
  try {
    //**************** clean input from null, undefined and empty string
    const cleanedInput = CleanNonRequiredInput(input);

    const { _id, updaterId, role } = cleanedInput;

    //**************** check if user's role is admin
    const isAdmin = await UserIsAdmin(updaterId);
    if (!isAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if user whose role is to be added exist
    const userIsExist = await UserIsExist(_id);
    if (!userIsExist) {
      throw new Error('User does not exist');
    }

    //**************** check if role is valid and normalized it
    const normalizedRole = NormalizeRole(role);

    //**************** check if user has the role
    const userHasRole = await UserHasRole(_id, normalizedRole);
    if (!userHasRole) {
      throw new Error('User does not have the role');
    }

    //**************** check if role can be removed
    const isRemovableRole = IsRemovableRole(normalizedRole);
    if (!isRemovableRole) {
      throw new Error('Role cannot be removed');
    }

    const updatedUser = await User.findOneAndUpdate({ _id }, { $pull: { roles: normalizedRole } }, { new: true }).lean();
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
    //**************** sanitize and validate id and deletedBy
    const validDeletedId = SanitizeAndValidateId(_id);
    const validDeletedBy = SanitizeAndValidateId(deletedBy);

    //**************** check if user's role is admin
    const userIsAdmin = await UserIsAdmin(validDeletedBy);
    if (!userIsAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if user exist
    const userIsExist = await UserIsExist(validDeletedId);
    if (!userIsExist) {
      throw new Error('User does not exist');
    }

    //**************** check if user is referenced by any student
    const userIsReferenced = await UserIsReferencedByStudent(validDeletedId);
    if (userIsReferenced) {
      throw new Error('User that is referenced by a student cannot be deleted');
    }

    await User.updateOne({ _id: validDeletedId }, { deleted_at: new Date(), status: 'deleted', deleted_by: validDeletedBy });
    return 'User deleted successfully';
  } catch (error) {
    throw new Error(error.message);
  }
}

// *************** LOADER ***************

/**
 * Resolve the student field by using DataLoader.
 * @param {object} parent - Parent, user object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function UserLoaderForStudent(parent, _, context) {
  if (!parent?.student_id) {
    return null;
  }
  const studentLoader = await context.loaders.student.load(parent.student_id);
  return studentLoader;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllUsers, GetOneUser },
  Mutation: { CreateUser, UpdateUser, AddRole, DeleteRole, DeleteUser },
  User: {
    student: UserLoaderForStudent,
  },
};
