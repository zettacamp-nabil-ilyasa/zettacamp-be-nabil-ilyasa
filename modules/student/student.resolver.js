// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const SchoolModel = require('../school/school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { allowedRolesForGetAllStudents, allowedRolesForCreateStudent, allowedRolesForDeleteStudent } = require('../../shared/strings.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** IMPORT HELPER ***************
const { StudentAggregatePipelineQueryBuilder } = require('./student.helper.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateStudentInput, ValidateUniqueStudentEmail, ValidateStudentFilterInput } = require('./student.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** QUERY ***************
/**
 * GraphQL resolver for fetching active students with pagination, filtering, and sorting.
 * @async
 * @param {Object} parent - Unused parent argument from GraphQL resolver.
 * @param {Object} args - Arguments passed from GraphQL query.
 * @param {Object} args.paginationInput - Input for pagination.
 * @param {Object} args.filterInput - Filter conditions.
 * @param {Object} args.sortInput - Sorting condition.
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - GraphQL context object, contains authenticated user data.
 * @returns {Promise<Object>} - Paginated student list with metadata.
 * @throws {ApolloError} - Throws error if something fails during query.
 */
async function GetAllStudents(parent, { paginationInput, filterInput, sortInput }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForGetAllStudents });

    // *************** validate pagination input
    ValidatePaginationInput(paginationInput);

    // *************** validate filter input
    ValidateStudentFilterInput(filterInput);

    // *************** set default value for page
    const page = paginationInput?.page ?? 1;

    // *************** set default value for limit
    const limit = paginationInput?.limit ?? 10;

    // *************** set how much documents skipped relative to page
    const skip = (page - 1) * limit;

    // *************** build the query
    const pipelineQuery = StudentAggregatePipelineQueryBuilder({ skip, limit, filterInput, sortInput });
    const students = await StudentModel.aggregate(pipelineQuery);

    // *************** deconstruct students
    const { data, total_count } = students[0] || {};

    // *************** set total_items and total_pages for pagination
    const total_items = total_count[0]?.count || 0;
    const total_pages = Math.ceil(total_items / limit);
    const pagedStudents = {
      data: data || [],
      pagination_info: {
        page,
        limit,
        total_items,
        total_pages,
      },
    };
    return pagedStudents;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllStudents',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ paginationInput, filterInput, sortInput }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active student by ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student to retrieve.
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - GraphQL context object, contains authenticated user data.
 * @returns {Promise<Object|null>} - The Student document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or student not found.
 */
async function GetOneStudent(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate student's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    const student = await StudentModel.findOne({ _id: _id, status: 'active' }).lean();

    // *************** throw error if there's no student to returned
    if (!student) {
      throw new ApolloError('student not found or already deleted');
    }
    return student;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** MUTATION ***************
/**
 * Create a new student after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Student input fields.
 * @param {string} input.email - Student's email address.
 * @param {string} input.first_name - Student's first name.
 * @param {string} input.last_name - Student's last name.
 * @param {string} input.school_id - ID of the school the student belongs to.
 * @param {string} input.date_of_birth - Student's date of birth as a string.
 * @param {string} input.created_by - User ID of the admin who creates the student.
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - GraphQL context object, contains authenticated user data.
 * @returns {Promise<Object>} - The newly created student document.
 * @throws {ApolloError} - Throws error if validation fails or email/school is invalid.
 */
async function CreateStudent(parent, { input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForCreateStudent });

    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateStudentInput(input);

    // *************** check if email already used by another student
    await ValidateUniqueStudentEmail(input.email);

    // *************** validate student's school_id
    ValidateMongoObjectId(input.school_id);

    // *************** compose new object from input
    const newStudent = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      school_id: input.school_id,
      date_of_birth: input.date_of_birth,
      created_by: context.user._id,
    };

    // *************** create student with composed object
    const createdStudent = await StudentModel.create(newStudent);

    // *************** add created student id to student array in school document
    await SchoolModel.updateOne({ _id: newStudent.school_id }, { $addToSet: { students: createdStudent._id } });

    return createdStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a student's information after validating input and checking existence.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Student update fields.
 * @param {string} input.email - New email address.
 * @param {string} input.first_name - Updated first name.
 * @param {string} input.last_name - Updated last name.
 * @param {string} [input.date_of_birth] - Updated date of birth in string format (optional).
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - GraphQL context object, contains authenticated user data.
 * @returns {Promise<Object>} - Updated student document.
 * @throws {ApolloError} - Throws error if student does not exist, email already used, or school not found.
 */
async function UpdateStudent(parent, { _id, input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate student's id
    ValidateMongoObjectId(_id);

    // *************** validation to ensure bad input is handled correctly
    ValidateStudentInput(input);

    // *************** get the student document
    const toBeUpdatedStudentDocument = await StudentModel.findOne({ _id, status: 'active' }).lean();

    // *************** sanity check for the student document
    if (!toBeUpdatedStudentDocument) {
      throw new ApolloError('student does not exist');
    }
    // *************** check if email changed using the student document
    if (input.email !== toBeUpdatedStudentDocument.email) {
      // *************** if email changed, also check if email already used by another student
      await ValidateUniqueStudentEmail(input.email);
    }

    // *************** compose new object from input
    let editedStudent = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      date_of_birth: input.date_of_birth,
      updated_by: context.user._id,
    };

    // *************** update student with composed object
    const updatedStudent = await StudentModel.findOneAndUpdate({ _id }, { $set: editedStudent }, { new: true }).lean();
    return updatedStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a student by marking their status as 'deleted' and removing them from associated school.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student to delete.
 * @param {object} context - Resolver context containing user data.
 * @param {object} context.user - GraphQL context object, contains authenticated user data.
 * @returns {Promise<string>} - Success message upon deletion.
 * @throws {ApolloError} - Throws error if unauthorized or student not found.
 */
async function DeleteStudent(parent, { _id }) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRolesForDeleteStudent });

    // *************** validate student's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // *************** soft delete student by updating it with composed object
    const softDeletedStudent = await StudentModel.updateOne(
      { _id, status: 'active' },
      { $set: { status: 'deleted', deleted_by: context.user._id, deleted_at: new Date() } }
    );

    // *************** sanity check for the next db operation, check if the student is exist and not already deleted
    if (softDeletedStudent.matchedCount === 0) {
      throw new ApolloError("student doesn't exist or already deleted");
    }

    // *************** remove student_id from student array in school document
    await SchoolModel.updateOne({ students: _id }, { $pull: { students: _id } });
    return 'Student deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the school_id field in a Student by using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - The parent student document.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - GraphQL context containing DataLoaders.
 * @returns {Promise<Object|null>} - The related school document or null if not found.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function school_id(parent, args, context) {
  try {
    // *************** check if student has any school_id
    if (!parent?.school_id) {
      return null;
    }

    // *************** load school
    const loadedSchool = await context.loaders.school.load(parent.school_id);
    return loadedSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'school_id',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a Student by using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - The parent student document.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - GraphQL context containing DataLoaders.
 * @returns {Promise<Object|null>} - The related user document or null if not found.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function created_by(parent, args, context) {
  try {
    // *************** check if student has any created_by
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
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudents, GetOneStudent },
  Mutation: { CreateStudent, UpdateStudent, DeleteStudent },
  Student: {
    created_by,
    school_id,
  },
};
