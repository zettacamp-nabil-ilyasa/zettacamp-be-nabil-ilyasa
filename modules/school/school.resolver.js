// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateSchoolInput, ValidateUniqueSchoolLongName } = require('./school.validators.js');
const { ValidateSchoolExistence } = require('../../utilities/validators/school-validator.js');
const { ValidateId } = require('../../utilities/validators/mongo-validator.js');

// **************** QUERY ****************
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
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active school by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the school to retrieve.
 * @returns {Promise<Object|null>} - School document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneSchool(parent, { _id }) {
  try {
    // **************** validate school's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    const school = await SchoolModel.findOne({ _id: _id, status: 'active' }).lean();

    // **************** throw error if there's no student to returned
    if (!school) {
      throw new ApolloError('cannot get the requested school');
    }
    return school;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneSchool',
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// **************** MUTATION ****************
/**
 * Create a new school after validating input and checking for duplicates.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - School input fields.
 * @param {string} input.long_name - Official name of the school.
 * @param {string} input.brand_name - Brand or alias name of the school.
 * @param {string} [input.address] - Address of the school (optional).
 * @param {string} [input.country] - Country of the school (optional).
 * @param {string} [input.city] - City of the school (optional).
 * @param {string} [input.zipcode] - Zip code (optional).
 * @param {string} [input.created_by - ID of the admin who creates the school.
 * @returns {Promise<Object>} - Created school document.
 * @throws {ApolloError} - Throws error if validation fails, user unauthorized, or name conflict occurs.
 */
async function CreateSchool(parent, { input }) {
  try {
    // *************** validation to ensure bad input is handled correctly
    ValidateSchoolInput(input);

    // *************** check if school long name already used by another school
    await ValidateUniqueSchoolLongName({ longName: input.long_name });

    // *************** compose new object from input for insert
    const newSchool = {
      long_name: input.long_name,
      brand_name: input.brand_name,
      address: input.address,
      country: input.country,
      city: input.city,
      zipcode: input.zipcode,
    };

    // *************** set static User id for created_by field
    const createdByUserId = '6862150331861f37e4e3d209';
    newSchool.created_by = createdByUserId;

    // *************** create school with composed object
    const createdSchool = await SchoolModel.create(newSchool);
    return createdSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateSchool',
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a school document after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - School input fields.
 * @param {string} input._id - ID of the school to update.
 * @param {string} input.long_name - Official name of the School.
 * @param {string} input.brand_name - Brand or alias name of the School.
 * @param {string} [input.address] - Address of the School (optional).
 * @param {string} [input.country] - Country of the School (optional).
 * @param {string} [input.city] - City of the School (optional).
 * @param {string} [input.zipcode] - Zip code of the School (optional).
 * @returns {Promise<Object>} - Updated school document.
 * @throws {ApolloError} - Throws error if validation fails or name conflict exists.
 */
async function UpdateSchool(parent, { _id, input }) {
  try {
    // *************** validate school's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateSchoolInput(input);

    // *************** check if school is exist
    await ValidateSchoolExistence(_id);

    // *************** check if School long name is used by another School
    await ValidateUniqueSchoolLongName({ schoolId: _id, longName: input.long_name });

    // *************** compose new object from input for update
    const editedSchool = {
      long_name: input.long_name,
      brand_name: input.brand_name,
      address: input.address,
      country: input.country,
      city: input.city,
      zipcode: input.zipcode,
    };

    // *************** update school with composed object
    const updatedSchool = await SchoolModel.findOneAndUpdate({ _id }, { $set: editedSchool }, { new: true }).lean();
    return updatedSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateSchool',
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a school by marking its status as 'deleted', prevents deletion if school is referenced by any student.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the school to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, school not found, or school is referenced.
 */
async function DeleteSchool(parent, { _id }) {
  try {
    // **************** validate school's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    // **************** get the School document
    const toBeDeletedSchoolDocument = await SchoolModel.findOne({ _id }).lean();

    // **************** check if School is exist
    if (!toBeDeletedSchoolDocument) {
      throw new ApolloError("School doesn't exist or already deleted");
    }

    // **************** check if School is referenced by Student
    if (toBeDeletedSchoolDocument.students.length) {
      throw new ApolloError('School that is referenced by Student cannot be deleted');
    }

    // **************** set static User id for deleted_by
    const deletedByUserId = '6862150331861f37e4e3d209';

    // **************** soft-delete School by updating it with composed object
    await SchoolModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by: deletedByUserId, deleted_at: new Date() } });
    return 'School deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteSchool',
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the students field in a School document using DataLoader.
 * @async
 * @param {object} parent - The school object containing student IDs.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.student - DataLoader instance for students.
 * @returns {Promise<Array<Object>>} - Array of student documents.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function students(parent, args, context) {
  try {
    // *************** check if school has any student
    if (!parent?.students.length) {
      return [];
    }

    // *************** load students
    const loadedStudents = await context.loaders.student.loadMany(parent.students);
    return loadedStudents;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'students',
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a School document using DataLoader.
 * @async
 * @param {object} parent - The school object containing created_by field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.user - DataLoader instance for users.
 * @returns {Promise<Object|null>} - The School document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function created_by(parent, args, context) {
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
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllSchools, GetOneSchool },
  Mutation: { CreateSchool, UpdateSchool, DeleteSchool },
  School: {
    students,
    created_by,
  },
};
