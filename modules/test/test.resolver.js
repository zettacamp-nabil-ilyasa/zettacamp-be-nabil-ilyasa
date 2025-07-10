// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model.js');
const SubjectModel = require('../subject/subject.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateTestInput } = require('./subject.validators.js');
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

    // **************** check if filter input provided
    if (filterInput.subject_id) {
      // **************** validate test's subject_id, ensure that it can be casted into valid ObjectId
      ValidateMongoObjectId(filterInput.subject_id);

      // **************** add filter to query
      query.block_id = filterInput.subject_id;
    }
    const testStatus = ['not_published', 'published'];
    if (testStatus) {
      if (!testStatus.includes(filterInput.status)) {
        throw new ApolloError('status should be not_published or published');
      }
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
