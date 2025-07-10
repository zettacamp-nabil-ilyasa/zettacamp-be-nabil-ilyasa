// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model.js');
const SubjectModel = require('../subject/subject.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateTestInput, ValidateTestFilterInput } = require('./test.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** IMPORT HELPER ***********************
const { TestPayloadComposer, GetTotalWeightOfTests } = require('./test.helper.js');

// **************** QUERY ****************
/**
 * Get all tests with optional filtering by subject_id, status and pagination.
 * @async
 * @function GetAllSubjects
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {String} [filterInput.subject_id] - Optional subject ID to filter tests
 * @param {String} [filterInput.status] - Optional status to filter tests
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {Number} [paginationInput.limit] - Number of tests per page
 * @param {Number} [paginationInput.offset] - Number of tests to skip
 * @returns {Promise<Array<Object>>} Array of test documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllTests({ filterInput, paginationInput }) {
  try {
    // **************** construct base query
    const query = { status: 'active' };

    // **************** validate filterInput
    ValidateTestFilterInput(filterInput);

    // **************** build query for subject_id if it exist
    if (filterInput.subject_id) {
      query.subject_id = filterInput.subject_id;
    }

    // **************** build query for status if it exist
    if (filterInput.status) {
      query.status = filterInput.status;
    }

    // **************** validate pagination's input
    ValidatePaginationInput(paginationInput);

    // **************** get tests based on query
    const tests = await TestModel.find(query)
      .skip(paginationInput.offset || 0)
      .limit(paginationInput.limit || 20)
      .lean();
    return tests;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllSubjects',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ filterInput, paginationInput }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active test by its ID.
 * @async
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {String} _id - ID of the test to retrieve.
 * @returns {Promise<Object|null>} - Subject document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneTest({ _id }) {
  try {
    // **************** validate test's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // **************** get the test document
    const test = await TestModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // **************** check if test document exist
    if (!test) {
      throw new ApolloError("test doesn't exist or already deleted");
    }
    return test;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneTest',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// **************** MUTATION ****************
/**
 * Create a new test after validating input.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Subject input fields.
 * @param {String} input.name - Name of test.
 * @param {String} [input.description] - Description of test.
 * @param {String} input.weight - Weight or proportion value of test, cannot exceed 1.
 * @param {Array<Object>} [input.notations] - Array of notation object containing notation_text and max_point.
 * @returns {Promise<Object>} - Created test document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function CreateTest({ input }) {
  try {
    // *************** validation to ensure bad input is handled correctly
    ValidateTestInput(input);

    // *************** check referenced subject existence in db
    const subjectIsExist = await SubjectModel.findOne({ _id: input.subject_id });
    if (!subjectIsExist) {
      throw new ApolloError("referenced subject doesn't exist");
    }

    // *************** check if combined tests weight is exceed 1
    const currentWeight = GetTotalWeightOfTests(input.subject_id);
    if (currentWeight + input.weight > 1) {
      throw new ApolloError('combined weight exceeding 1');
    }

    // *************** compose test payload
    const newTest = TestPayloadComposer(input, { checkSubjectId: true });
    const createdTest = await TestModel.create(newTest);
    return createdTest;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateTest',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a test document after validating test's id and input.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the subject to update.
 * @param {object} input - Test input fields.
 * @param {string} input.name - Name of test.
 * @param {string} [input.description] - Description of test.
 * @param {string} input.weight - Weight or proportional value of test.
 * @param {Array<Object>} [input.notations] - Array of notation object containing notation_text and max_point.
 * @returns {Promise<Object>} - Updated test document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function UpdateTest({ _id, input }) {
  try {
    // *************** validate test's id
    ValidateMongoObjectId(_id);

    // *************** validate input to ensure bad input is handled correctly
    ValidateTestInput(input);

    // *************** get test document
    const toBeUpdatedTestDocument = await TestModel.findOne({ _id, status: { $ne: 'deleted' } });
    if (!toBeUpdatedTestDocument) {
      throw new ApolloError("test doesn't exist or already deleted");
    }

    // *************** check if combined tests weight is exceed 1
    const currentWeight = GetTotalWeightOfTests(toBeUpdatedTestDocument.subject_id);
    if (currentWeight + input.weight > 1) {
      throw new ApolloError('combined weight exceeding 1');
    }

    // *************** compose test payload
    const editedTest = TestPayloadComposer(input, { checkSubjectId: false });
    const updatedTest = await TestModel.findOneAndUpdate({ _id }, editedTest, { new: true }).lean();
    return updatedTest;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateTest',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a test by marking its status as 'deleted'.
 * Prevents deletion if test status is published.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the test to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, subject not found, or subject is referenced.
 */
async function DeleteTest({ _id }) {
  try {
    // *************** validate test's id
    ValidateMongoObjectId(_id);

    // *************** get test document
    const toBeDeletedTestDocument = await TestModel.findOne({ _id, status: { $ne: 'deleted' } });
    if (!toBeDeletedTestDocument) {
      throw new ApolloError("test doesn't exist or already deleted");
    }
    // *************** check if status is published
    if ((toBeDeletedTestDocument.status = 'published')) {
      throw new ApolloError('test that have been published cannot be deleted');
    }
    // *************** update status to deleted and set deleted_at
    await TestModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_at: new Date() } });

    // *************** remove test's id from subject's test_ids field
    await SubjectModel.updateOne({ _id: toBeDeletedTestDocument.subject_id }, { $pull: { test_ids: _id } });
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteTest',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the created_by field in a School document using DataLoader.
 * @async
 * @param {object} parent - The subject object containing subject_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.subject - DataLoader instance for subjects.
 * @returns {Promise<Object|null>} - The subject document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function subject_id(parent, args, context) {
  try {
    // *************** check if test has any subject_id
    if (!parent?.subject_id) {
      return null;
    }

    // *************** load user
    const loadedUser = await context.loaders.subject.load(parent.subject_id);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'subject_id',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllTests, GetOneTest },
  Mutation: { CreateTest, UpdateTest, DeleteTest },
  Subject: {
    subject_id,
  },
};
