// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model.js');
const SubjectModel = require('../subject/subject.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');
const { allowedRoles } = require('../../shared/strings.js');

// *************** IMPORT UTILITIES ***************
const { UserIsAuthorized } = require('../../middleware/authorization.js');

// *************** IMPORT HELPER ***************
const {
  CreateTestPayloadComposer,
  UpdateTestPayloadComposer,
  GetTotalWeightOfTests,
  CreateAssignCorrectorTask,
  TestPassConditionPayloadComposer,
} = require('./test.helper.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateTestInput, ValidateTestFilterInput, ValidateTestPassConditionInput } = require('./test.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** QUERY ****************
/**
 * Get all tests with optional filtering by subject_id, status and pagination.
 * @async
 * @function GetAllTests
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
async function GetAllTests(parent, { filterInput, paginationInput }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Test.GetAllTests });

    // *************** validate filterInput
    ValidateTestFilterInput(filterInput);

    // *************** validate pagination's input
    ValidatePaginationInput(paginationInput);

    // *************** construct base query
    const query = { status: { $ne: 'deleted' } };

    // *************** build query for subject_id if it exist
    if (filter?.subject_id) {
      query.subject_id = filter.subject_id;
    }

    // *************** build query for status if it exist
    if (filter?.status) {
      query.status = filter.status;
    }

    // *************** set default limit and offset
    const limit = paginationInput?.limit ?? 10;
    const page = paginationInput?.page ?? 1;
    const skip = (page - 1) * limit;

    // *************** get tests based on query
    const tests = await TestModel.find(query).skip(skip).limit(limit).sort({ created_at: -1 }).lean();
    return tests;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllTests',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ filter, pagination }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active test by its ID.
 * @async
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {String} _id - ID of the test to retrieve.
 * @returns {Promise<Object|null>} - Task document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneTest(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user });

    // *************** validate test's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // *************** get the test document
    const test = await TestModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();

    // *************** check if test document exist
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

// *************** MUTATION ****************
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
async function CreateTest(parent, { input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Test.CreateTest });

    // *************** validation to ensure bad input is handled correctly
    ValidateTestInput(input);

    // *************** check referenced subject existence in db
    const subjectIsExist = await SubjectModel.findOne({ _id: input.subject_id }).lean();
    if (!subjectIsExist) {
      throw new ApolloError("referenced subject doesn't exist");
    }

    // *************** check if combined tests weight is exceed 1
    const currentCombinedWeights = await GetTotalWeightOfTests(input.subject_id);
    if (currentCombinedWeights + input.weight > 1) {
      throw new ApolloError('combined weight exceeding 1');
    }

    // *************** compose test payload
    const newTest = CreateTestPayloadComposer({ inputObject: input, userId: context.user._id });
    const createdTest = await TestModel.create(newTest);

    // *************** add test's id to subject's test_ids field
    await SubjectModel.updateOne({ _id: input.subject_id }, { $addToSet: { test_ids: createdTest._id } });
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
async function UpdateTest(parent, { _id, input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Test.UpdateTest });

    // *************** validate test's id
    ValidateMongoObjectId(_id);

    // *************** validate input to ensure bad input is handled correctly
    ValidateTestInput(input);

    // *************** get test document
    const toBeUpdatedTestDocument = await TestModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();
    if (!toBeUpdatedTestDocument) {
      throw new ApolloError("test doesn't exist or already deleted");
    }

    // *************** check if subject_id is changed, changing subject_id is not allowed
    if (input.subject_id !== String(toBeUpdatedTestDocument.subject_id)) {
      throw new ApolloError('subject_id cannot be changed');
    }

    // *************** check if combined tests weight is exceed 1
    const currentCombinedWeights = await GetTotalWeightOfTests(input.subject_id);
    if (currentCombinedWeights - toBeUpdatedTestDocument.weight + input.weight > 1) {
      throw new ApolloError('combined weight exceeding 1');
    }

    // *************** compose test payload
    const editedTest = UpdateTestPayloadComposer({ inputObject: input, userId: context.user._id });
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
 * Add pass_conditions field into a specific test
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {String} _id - _id of the block
 * @param {Array<Object>} input - an array of object containing pass/fail criteria
 * @param {Number} input.parameter_value - pass condition's parameter_value to be used as comparator
 *@param  {String} input.math_operator - string representation of math_operator
 */
async function AddTestPassCondition(parent, { _id, input }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Test.AddTestPassCondition });

    // *************** validate test's id
    ValidateMongoObjectId(_id);

    // *************** validate test's pass_condition input
    ValidateTestPassConditionInput(input);

    // *************** compose payload
    const testPassConditionsPayload = TestPassConditionPayloadComposer(input);
    const addedPassConditions = await TestModel.findOneAndUpdate(
      { _id },
      { pass_condition: testPassConditionsPayload, updated_by: context.user._id },
      { new: true }
    );
    return addedPassConditions;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'AddTestPassConditions',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Publish a test by updating its status and creating an `assign_corrector` task.
 * @async
 * @param {Object} parent - Unused GraphQL resolver parent argument.
 * @param {Object} args - Resolver arguments.
 * @param {string} args._id - The ID of the test to be published.
 * @returns {Promise<Object>} The updated test document after being published.
 * @throws {ApolloError} If the test is not found or already published, or if the update fails.
 */
async function PublishTest(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Test.PublishTest });

    // *************** validate test's id
    ValidateMongoObjectId(_id);

    // *************** get test document
    const testDocument = await TestModel.findOne({ _id, status: 'not_published' }).lean();

    // *************** check if test's status is not published
    if (!testDocument) {
      throw new ApolloError('only not published test can be published');
    }

    // *************** update test's status to published and published date
    const publishedTest = await TestModel.findOneAndUpdate(
      { _id },
      { status: 'published', published_date: new Date(), published_by: context.user._id },
      { new: true }
    ).lean();

    // *************** check if update is successful
    if (!publishedTest) {
      throw new ApolloError('failed to publish test');
    }

    // *************** create assign corrector task
    await CreateAssignCorrectorTask({ userId: context.user._id, testId: _id });

    return publishedTest;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'PublishTest',
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({ _id }),
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
async function DeleteTest(parent, { _id }, context) {
  try {
    // *************** apply authorization
    UserIsAuthorized({ userData: context.user, allowedRoles: allowedRoles.Test.DeleteTest });

    // *************** validate test's id
    ValidateMongoObjectId(_id);

    // *************** get test document
    const toBeDeletedTestDocument = await TestModel.findOne({ _id, status: { $ne: 'deleted' } }).lean();
    if (!toBeDeletedTestDocument) {
      throw new ApolloError("test doesn't exist or already deleted");
    }
    // *************** check if status is published
    if (toBeDeletedTestDocument.status === 'published') {
      throw new ApolloError('test that have been published cannot be deleted');
    }
    // *************** update status to deleted and set deleted_at
    await TestModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by: context.user._id, deleted_at: new Date() } });

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
      path: '/modules/test/test.resolver.js',
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
      path: '/modules/test/test.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllTests, GetOneTest },
  Mutation: { CreateTest, UpdateTest, PublishTest, AddTestPassCondition, DeleteTest },
  Test: {
    subject_id,
    created_by,
    updated_by,
  },
};
