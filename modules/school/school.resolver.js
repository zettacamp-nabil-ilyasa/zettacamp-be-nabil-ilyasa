// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const {
  allowedRolesForGetAllSchools,
  allowedRolesForCreateSchool,
  allowedRolesForUpdateSchool,
  allowedRolesForDeleteSchool,
} = require('../../shared/strings.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** IMPORT HELPER ***************
const { SchoolAggregatePipelineQueryBuilder } = require('./school.helper.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateSchoolInput, ValidateUniqueSchoolLongName } = require('./school.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// *************** QUERY ****************
/**
 * Get paginated, sorted, and optionally filtered list of active schools.
 * If `filterInput.student_name` is provided, performs aggregation with `$lookup` and `$facet`
 * to support filtering by student name across referenced collections.
 *
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {Object} args - GraphQL arguments.
 * @param {Object} paginationInput - Pagination input containing `page` and `limit`.
 * @param {Object} filterInput - Optional filter input, e.g. `student_name`.
 * @param {Object} sortInput - Sort input, containing `sort_by` and `sort_order`.
 * @param {Object} context - GraphQL context object, contains authenticated user data.
 * @returns {Promise<Object>} An object containing data (school documents) and pagination_info
 * @throws {ApolloError} If user is not authorized or database query fails.
 */
async function GetAllSchools(parent, { paginationInput, filterInput, sortInput }) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForGetAllSchools });

    const sortOption = {};
    // *************** object for sort field mapping
    const sortFieldMap = {
      long_name: 'long_name',
      brand_name: 'brand_name',
      created_at: 'created_at',
    };

    // *************** set default value for sortField
    const sortField = sortFieldMap[sortInput?.sort_by] || 'created_at';

    // *************** set default value for sortOrder
    const sortOrder = sortInput?.sort_order === 'desc' ? -1 : 1;

    sortOption[sortField] = sortOrder;

    // *************** set default value for page
    const page = paginationInput?.page ?? 1;

    // *************** set default value for limit
    const limit = paginationInput?.limit ?? 10;

    // *************** set how much documents skipped relative to page
    const skip = (page - 1) * limit;

    // *************** check if student_name is provided
    if (filterInput?.student_name) {
      // *************** build query for aggregate pipeline
      const pipelineQuery = SchoolAggregatePipelineQueryBuilder({ limit, skip, filterInput, sortInput });

      // *************** add sort and pagination data for pipeline query
      const schools = await SchoolModel.aggregate(pipelineQuery);

      // *************** set total_items and total_pages from schools result
      const { data, total_count } = schools[0] || {};
      const total_items = total_count[0].count || 0;
      const total_pages = Math.ceil(total_items / limit);

      const pagedSchools = {
        data: data || [],
        pagination_info: {
          page,
          limit,
          total_items,
          total_pages,
        },
      };
      return pagedSchools;
    }

    // *************** set query for 'find' operation
    const query = { status: 'active' };
    if (filterInput?.country) query.country = filterInput.country;

    // *************** get total documents with status 'active' within UserModel
    const total_items = await SchoolModel.countDocuments(query);

    // *************** count total pages possible
    const total_pages = Math.ceil(total_items / limit);

    const schools = await SchoolModel.find(query).sort(sortOption).skip(skip).limit(limit).lean();
    const pagedSchools = {
      data: schools,
      pagination_info: {
        page,
        limit,
        total_items,
        total_pages,
      },
    };
    return pagedSchools;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllSchools',
      path: '/modules/school/school.resolver.js',
      parameter_input: JSON.stringify({ paginationInput, filterInput, sortInput }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active school by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the school to retrieve.
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - GraphQL context object, contains authenticated user data.
 * @returns {Promise<Object|null>} - School document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneSchool(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate school's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    const school = await SchoolModel.findOne({ _id: _id, status: 'active' }).lean();

    // *************** throw error if there's no school to return
    if (!school) {
      throw new ApolloError('school not found or already deleted');
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

// *************** MUTATION ****************
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
 * @param {string} [input.created_by] - ID of the admin who creates the school.
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - Authenticated user data.
 * @returns {Promise<Object>} - Created school document.
 * @throws {ApolloError} - Throws error if validation fails, user unauthorized, or name conflict occurs.
 */
async function CreateSchool(parent, { input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForCreateSchool });

    // *************** validation to ensure bad input is handled correctly
    ValidateSchoolInput(input);

    // *************** check if school long name already used by another school
    await ValidateUniqueSchoolLongName(input.long_name);

    // *************** compose new object from input for insert
    const newSchool = {
      long_name: input.long_name,
      brand_name: input.brand_name,
      address: input.address,
      country: input.country,
      city: input.city,
      zipcode: input.zipcode,
      created_by: context.user._id,
    };

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
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - Authenticated user data.
 * @returns {Promise<Object>} - Updated school document.
 * @throws {ApolloError} - Throws error if validation fails or name conflict exists.
 */
async function UpdateSchool(parent, { _id, input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForUpdateSchool });

    // *************** validate school's id
    ValidateMongoObjectId(_id);

    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateSchoolInput(input);

    // *************** get the school document
    const toBeUpdatedSchoolDocument = await SchoolModel.findOne({ _id, status: 'active' }).lean();

    // *************** sanity check for the school document
    if (!toBeUpdatedSchoolDocument) {
      throw new ApolloError("school doesn't exist");
    }

    // *************** check if long name is changed using the school document
    if (input.long_name !== toBeUpdatedSchoolDocument.long_name) {
      // *************** if long name changed, also check if school long name is used by another School
      await ValidateUniqueSchoolLongName(input.long_name);
    }

    // *************** compose new object from input for update
    const editedSchool = {
      long_name: input.long_name,
      brand_name: input.brand_name,
      address: input.address,
      country: input.country,
      city: input.city,
      zipcode: input.zipcode,
      updated_by: context.user.updated_by,
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
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - Authenticated user data.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, school not found, or school is referenced.
 */
async function DeleteSchool(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForDeleteSchool });

    // *************** validate school's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // *************** get the School document
    const toBeDeletedSchoolDocument = await SchoolModel.findOne({ _id, status: 'active' }).lean();

    // *************** sanity check for the school document, check if the school is exist and not already deleted
    if (!toBeDeletedSchoolDocument) {
      throw new ApolloError("school doesn't exist or already deleted");
    }

    // *************** check if school is referenced by student using the school document
    if (toBeDeletedSchoolDocument.students?.length) {
      throw new ApolloError('School that is referenced by Student cannot be deleted');
    }

    // *************** soft-delete School by updating it with composed object
    await SchoolModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by: context.user._id, deleted_at: new Date() } });
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
