// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentTestResultModel = require('./student_test_result.model.js');
const TaskModel = require('../task/task.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { allowedRoles } = require('../../shared/strings.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** IMPORT HELPER ***************
const {
  EnterMarksPayloadComposer,
  CreateValidateMarksTask,
  SetEnterMarksTaskToCompleted,
  CompareTestNotationsAndMarks,
} = require('./student_test_result.helper.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateStudentTestResultFilterInput, ValidateEnterMarksInput } = require('./studentTestResult.validators.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// *************** QUERY ****************
/**
 * Get all studentTestResult with optional filtering by test_id, status, and pagination.
 * @async
 * @function GetAllStudentTestResult
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {string} [filterInput.test_id] - Optional test ID to filter studentTestResult
 * @param {string} [filterInput.status] - Optional test ID to filter studentTestResult
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {number} [paginationInput.limit] - Number of tests per page
 * @param {number} [paginationInput.offset] - Number of tests to skip
 * @returns {Promise<Array<Object>>} Array of test documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllStudentTestResults(parent, { filterInput, paginationInput }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.StudentTestResult.GetAllStudentTestResults });

    // *************** validate filterInput if provided
    ValidateStudentTestResultFilterInput(filterInput);

    // *************** validate paginationInput if provided
    ValidatePaginationInput(paginationInput);

    // *************** build base query
    const query = { status: { $ne: 'deleted' } };

    // *************** add test_id filter if provided
    if (filter?.test_id) {
      query.test_id = filter.test_id;
    }

    // *************** add status filter if provided
    if (filter?.status) {
      query.status = filter.status;
    }

    // *************** set default limit and page
    const limit = paginationInput?.limit ?? 10;
    const page = paginationInput.page ?? 1;
    const skip = (page - 1) * limit;

    // *************** execute query
    const studentTestResults = await StudentTestResultModel.find(query).skip(skip).limit(limit).sort({ created_at: -1 }).lean();
    return studentTestResults;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllStudentTestResult',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ filter, pagination }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one not-deleted student test result by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student test result to retrieve.
 * @returns {Promise<Object>} - Student test result document or error if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneStudentTestResult(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate studentTestResult's id
    ValidateMongoObjectId(_id);

    // *************** get studentTestResult's document
    const studentTestResult = await StudentTestResultModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // *************** check if studentTestResult is exist
    if (!studentTestResult) {
      throw new ApolloError("student test result doesn't exist or already deleted");
    }
    return studentTestResult;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneStudentTestResult',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Create a StudentTestResult document using data from input.
 * Also updates the associated enter_marks task status to 'completed' and creates a validate_marks task for validation phase.
 * @async
 * @function EnterMarks
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {Object} params - Function parameters.
 * @param {string} params.task_id - The ID of the enter_marks task.
 * @param {Array<Object>} params.marks - The array of mark objects to be recorded.
 * @param {string} params.marks[].notation_text - The notation text associated with the mark.
 * @param {number} params.marks[].mark - The mark given for a corresponding notation.
 * @returns {Promise<Object>} The newly created StudentTestResult document.
 * @throws {ApolloError} If validation fails, student test result already exists, or any DB operation fails.
 */
async function EnterMarks(parent, { task_id, marks }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.StudentTestResult.EnterMarks });

    // *************** validate input
    ValidateEnterMarksInput({ taskId: task_id, studentMarks: marks });

    // *************** get task document, ensure that there is an in_progress enter_marks task
    const taskDocument = await TaskModel.findOne({ _id: task_id, type: 'enter_marks', status: 'in_progress' }).lean();

    // *************** check if the task is really exist
    if (!taskDocument) {
      throw new ApolloError('an in_progress enter_marks task does not exist');
    }

    // *************** compare test notations and marks, ensure that each notation has a corresponding mark
    await CompareTestNotationsAndMarks({ marks, testId: taskDocument.test_id });

    // *************** check if student test result with same task_id, test_id, and student_id already exist
    const studentTestResult = await StudentTestResultModel.findOne({
      task_id,
      test_id: taskDocument.test_id,
      student_id: taskDocument.student_id,
    }).lean();
    if (studentTestResult) {
      throw new ApolloError('student test result already exist');
    }

    // *************** compose enter marks payload
    const enteredMarks = EnterMarksPayloadComposer({ taskDocument, studentMarks: marks, userId: context.user._id });

    // *************** create student test result using the payload
    const createdStudentTestResult = await StudentTestResultModel.create(enteredMarks);
    if (!createdStudentTestResult) {
      throw new ApolloError('failed to create student test result');
    }

    // *************** set enter marks task to completed
    await SetEnterMarksTaskToCompleted(task_id);

    // *************** create validate marks task
    await CreateValidateMarksTask({ studentTestResultId: createdStudentTestResult._id, userId: context.user._id, taskDocument });

    return createdStudentTestResult;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'EnterMarks',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ task_id, marks }),
    });
    throw new ApolloError(error.stack);
  }
}

/**
 * Update an already completed student test result.
 * Not affecting any tasks status.
 * @async
 * @function UpdateEnteredMarks
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {Object} params - Function parameters.
 * @param {string} params.task_id - The ID of a validate_marks task.
 * @param {Array<Object>} params.marks - The array of mark objects to be recorded.
 * @param {string} params.marks[].notation_text - The notation text associated with the mark.
 * @param {number} params.marks[].mark - The mark given for a corresponding notation.
 * @returns {Promise<Object>} The newly created StudentTestResult document.
 * @throws {ApolloError} If validation fails, student test result already exists, or any DB operation fails.
 */
async function UpdateEnteredMarks(parent, { _id, task_id, marks }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.StudentTestResult.UpdateEnteredMarks });

    // *************** validate student test result's id
    ValidateMongoObjectId(_id);

    // *************** validate input
    ValidateEnterMarksInput({ taskId: task_id, studentMarks: marks });

    // *************** get student test result
    const toBeUpdatedStudentTestResult = await StudentTestResultModel.findOne({ _id, status: 'completed' }).lean();

    // *************** check if a completed student test result is exist
    if (!toBeUpdatedStudentTestResult) {
      throw new ApolloError('a completed student test result does not exist');
    }

    // *************** get task document, ensure that there is an in_progress validate_marks task
    const taskDocument = await TaskModel.findOne({ _id: task_id, type: 'validate_marks', status: 'in_progress' }).lean();

    // *************** check if the task is really exist
    if (!taskDocument) {
      throw new ApolloError('an in_progress validate_marks task does not exist');
    }

    // *************** ensure that task is referencing the student test result (actually related to the student test result)
    if (_id !== String(taskDocument.student_test_result_id)) {
      throw new ApolloError('the task is not related with the StudentTestResult');
    }

    // *************** compare test notations and marks, ensure that each notation has a corresponding mark
    await CompareTestNotationsAndMarks({ marks, testId: taskDocument.test_id });

    // *************** compose enter marks payload
    const enteredMarks = EnterMarksPayloadComposer({ taskDocument, studentMarks: marks, userId: context.user._id });

    // *************** update student test result using the payload
    const updatedStudentTestResult = await StudentTestResultModel.findOneAndUpdate({ _id }, enteredMarks, { new: true });

    return updatedStudentTestResult;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateEnteredMarks',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ _id, task_id, marks }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a student test result by marking its status as 'deleted'.
 * Also deletes associated task.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student test result to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if student test result not found or the status is is not 'validated'.
 */
async function DeleteStudentTestResult(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.StudentTestResult.DeleteStudentTestResult });

    // *************** validate student test result's id
    ValidateMongoObjectId(_id);

    // *************** get the student test result document
    const toBeDeletedStudentTestResultDocument = await StudentTestResultModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // *************** check if the student test result is exist
    if (!toBeDeletedStudentTestResultDocument) {
      throw new ApolloError("student test result doesn't exist or already deleted");
    }

    // *************** check if the student test result's status is not validated, only validated student test result can be deleted
    if (toBeDeletedStudentTestResultDocument.status !== 'validated') {
      throw new ApolloError('only validated student test result that can be deleted');
    }

    // *************** soft-delete the student test result document by set status and deleted_at
    await StudentTestResultModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by: context.user._id, deleted_at: new Date() } });

    // *************** also soft-delete validate_marks task that stores the student test result's id
    await TaskModel.updateOne(
      { _id: toBeDeletedStudentTestResultDocument.task_id },
      { $set: { status: 'deleted', deleted_at: new Date() } }
    );

    return 'student test result is succesfully deleted';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteStudentTestResult',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the task_id field in a student test result document using DataLoader.
 * @async
 * @param {object} parent - The student test result object containing task_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.task - DataLoader instance for task.
 * @returns {Promise<Object|null>} - The task document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function task_id(parent, args, context) {
  try {
    // *************** check if task_id exist
    if (!parent.task_id) {
      return null;
    }
    // *************** load task
    const task = await context.loaders.task.load(parent.task_id);
    return task;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'task_id',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the test_id field in a student test result document using DataLoader.
 * @async
 * @param {object} parent - The student test result object containing test_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.user - DataLoader instance for test.
 * @returns {Promise<Object|null>} - The Test document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function test_id(parent, args, context) {
  try {
    // *************** check if test_id exist
    if (!parent.test_id) {
      return null;
    }
    // *************** load test
    const test = await context.loaders.test.load(parent.test_id);
    return test;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'test_id',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the student_id field in a student test result document using DataLoader.
 * @async
 * @param {object} parent - The student test result object containing student_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.user - DataLoader instance for users.
 * @returns {Promise<Object|null>} - The student document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function student_id(parent, args, context) {
  try {
    // *************** check if student_id exist
    if (!parent.student_id) {
      return null;
    }
    // *************** load student
    const student = await context.loaders.student.load(parent.student_id);
    return student;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'student_id',
      path: '/modules/studentTestResult/studentTestResult.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a user object using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - Parent user object.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context that contains DataLoaders.
 * @returns {Promise<Object|null>} - The User document or null if not available.
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
      path: '/modules/student_test_result/student_test_result.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the updated_by field in a user object using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - Parent user object.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context that contains DataLoaders.
 * @returns {Promise<Object|null>} - The User document or null if not available.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function updated_by(parent, args, context) {
  try {
    // *************** check if user has any created_by
    if (!parent?.updated_by) {
      return null;
    }

    // *************** load user
    const loadedUser = await context.loaders.user.load(parent.updated_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'created_by',
      path: '/modules/student_test_result/student_test_result.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudentTestResults, GetOneStudentTestResult },
  Mutation: { EnterMarks, UpdateEnteredMarks, DeleteStudentTestResult },
  StudentTestResult: {
    task_id,
    test_id,
    student_id,
    created_by,
    updated_by,
  },
};
