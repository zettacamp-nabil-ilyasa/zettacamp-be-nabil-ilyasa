// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATORS ***********************
const { ValidateSchoolCreateInput, ValidateSchoolUpdateInput } = require('./school.validators.js');

// *************** IMPORT UTILS ***************
const { ValidateId } = require('../../utils/common-validator.js');
const { SchoolIsExist, UserIsAdmin } = require('../../utils/common.js');

// *************** IMPORT HELPER ***************
const { SchoolNameIsExist, SchoolIsReferencedByStudent } = require('./school.helpers.js');

//**************** QUERY ****************

/**
 * Get all active schools from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of school documents with status 'active'.
 * @throws {ApolloError} - Throws error if database query fails.
 */

async function GetAllSchools() {
  try {
    const schools = await SchoolModel.find({ status: 'active' }).lean();
    return schools;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllSchools',
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active school by its ID.
 * @async
 * @param {object} _ - Unused resolver argument.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the school to retrieve.
 * @returns {Promise<Object|null>} - School document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneSchool(_, { _id }) {
  try {
    //**************** validate id
    ValidateId(_id);

    const school = await SchoolModel.findOne({ _id: _id, status: 'active' }).lean();
    return school;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneSchool',
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

//**************** MUTATION ****************
/**
 * Create a new school after validating input and checking for duplicates.
 * @async
 * @param {object} _ - Unused resolver argument.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - School input fields.
 * @param {string} args.input.long_name - Official name of the school.
 * @param {string} args.input.brand_name - Brand or alias name of the school.
 * @param {string} [args.input.address] - Address of the school (optional).
 * @param {string} [args.input.country] - Country of the school (optional).
 * @param {string} [args.input.city] - City of the school (optional).
 * @param {string} [args.input.zipcode] - Zip code (optional).
 * @param {string} args.input.created_by - ID of the admin who creates the school.
 * @returns {Promise<Object>} - Created school document.
 * @throws {ApolloError} - Throws error if validation fails, user unauthorized, or name conflict occurs.
 */
async function CreateSchool(_, { input }) {
  try {
    // *************** compose new object from input
    const newSchool = {
      long_name: input.long_name,
      brand_name: input.brand_name,
      address: input.address,
      country: input.country,
      city: input.city,
      zipcode: input.zipcode,
      created_by: input.created_by,
    };

    // *************** validation to ensure bad input is handled correctly
    ValidateSchoolCreateInput(newSchool);

    // *************** check if user with id from created_by is exist and has admin role
    const userIsAdmin = await UserIsAdmin(newSchool.created_by);
    if (!userIsAdmin) {
      throw new ApolloError('User is not admin');
    }

    // *************** check if school name already exists
    const isSchoolNameExist = await SchoolNameIsExist({ longName: newSchool.long_name, brandName: newSchool.brand_name });
    if (isSchoolNameExist) {
      throw new ApolloError('School name already exist');
    }

    // *************** create school with composed object
    const createdSchool = await SchoolModel.create(newSchool);
    return createdSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateSchool',
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify(input),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a school document after validating input and checking constraints.
 * @async
 * @param {object} _ - Unused resolver argument.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - School input fields.
 * @param {string} args.input._id - ID of the school to update.
 * @param {string} [args.input.long_name] - Official name of the school (optional).
 * @param {string} [args.input.brand_name] - Brand or alias name of the school (optional).
 * @param {string} [args.input.address] - Address of the school (optional).
 * @param {string} [args.input.country] - Country of the school (optional).
 * @param {string} [args.input.city] - City of the school (optional).
 * @param {string} [args.input.zipcode] - Zip code (optional).
 * @returns {Promise<Object>} - Updated school document.
 * @throws {ApolloError} - Throws error if validation fails or name conflict exists.
 */
async function UpdateSchool(_, { input }) {
  try {
    // *************** compose new object from input
    const editedSchool = {
      _id: input._id,
      long_name: input.long_name,
      brand_name: input.brand_name,
      address: input.address,
      country: input.country,
      city: input.city,
      zipcode: input.zipcode,
    };

    // *************** validation to ensure bad input is handled correctly
    ValidateSchoolUpdateInput(editedSchool);

    // *************** check if school exists
    const schoolIsExist = await SchoolIsExist(editedSchool._id);
    if (!schoolIsExist) {
      throw new ApolloError('School does not exist');
    }

    // *************** check if school name already exists
    const isSchoolNameExist = await SchoolNameIsExist({
      longName: editedSchool.long_name,
      brandName: editedSchool.brand_name,
      schoolId: editedSchool._id,
    });
    if (isSchoolNameExist) {
      throw new ApolloError('School name already exist');
    }

    // *************** update school with composed object
    const updatedSchool = await SchoolModel.findOneAndUpdate({ _id: editedSchool._id }, { $set: editedSchool }, { new: true }).lean();
    return updatedSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateSchool',
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify(input),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a school by marking its status as 'deleted', prevents deletion if school is referenced by any student.
 * @async
 * @param {object} _ - Unused resolver argument.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the school to delete.
 * @param {string} args.deleted_by - ID of the admin who deletes the school.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, school not found, or school is referenced.
 */
async function DeleteSchool(_, { _id, deleted_by }) {
  try {
    //**************** validate _id and deleted_by
    ValidateId(_id);
    ValidateId(deleted_by);

    //**************** check if deleter user is exist and has admin role
    const userIsAdmin = await UserIsAdmin(deleted_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if school to be deleted is exist
    const schoolIsExist = await SchoolIsExist(_id);
    if (!schoolIsExist) {
      throw new ApolloError('School does not exist');
    }

    //**************** check if school is referenced by any student
    const schoolIsReferenced = await SchoolIsReferencedByStudent(_id);
    if (schoolIsReferenced) {
      throw new ApolloError('School that is referenced by a student cannot be deleted');
    }

    //**************** soft-delete school by updating it with composed object
    await SchoolModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by, deleted_at: new Date() } });
    return 'School deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteSchool',
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify({ _id, deleted_by }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************

/**
 * Resolve the students field in a School document using DataLoader.
 * @async
 * @param {object} parent - The school object containing student IDs.
 * @param {object} _ - Unused resolver argument.
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.student - DataLoader instance for students.
 * @returns {Promise<Array<Object>>} - Array of student documents.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function students(parent, _, context) {
  try {
    // *************** check if school has any student
    if (!parent?.students) {
      return [];
    }

    // *************** load students
    const loadedStudents = await context.loaders.student.loadMany(parent.students);
    return loadedStudents;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'students',
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a School document using DataLoader.
 * @async
 * @param {object} parent - The school object containing created_by field.
 * @param {object} _ - Unused resolver argument.
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.user - DataLoader instance for users.
 * @returns {Promise<Object|null>} - The user document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function created_by(parent, _, context) {
  try {
    // *************** check if school has any created_by
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
      path: '/graphql/school/school.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  Query: { GetAllSchools, GetOneSchool },
  Mutation: { CreateSchool, UpdateSchool, DeleteSchool },
  School: {
    students,
    created_by,
  },
};
