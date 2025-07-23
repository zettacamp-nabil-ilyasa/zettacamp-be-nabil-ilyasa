// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SubjectModel = require('./subject.model.js');
const BlockModel = require('../block/block.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateSubjectInput, ValidateSubjectFilterInput, ValidateSubjectPassConditionsInput } = require('./subject.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');
const { ValidatePaginationInput } = require('../../utilities/validators/pagination-validator.js');

// *************** IMPORT HELPER ***************
const { SubjectPayloadComposer, SubjectPassConditionsPayloadComposer } = require('./subject.helper.js');

// *************** QUERY ****************
/**
 * Get all subjects with optional filtering by subject_id and pagination.
 * @async
 * @function GetAllSubjects
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {string} [filterInput.block_id] - Optional subject ID to filter subjects
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {number} [paginationInput.limit] - Number of subjects per page
 * @param {number} [paginationInput.offset] - Number of subjects to skip
 * @returns {Promise<Array<Object>>} Array of subject documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllSubjects(parent, { filter, pagination }) {
  try {
    // *************** validate filter's input
    ValidateSubjectFilterInput(filter);

    // *************** validate pagination's input
    ValidatePaginationInput(pagination);

    // *************** construct base query
    const query = { status: 'active' };

    // *************** check if filter input provided
    if (filter?.block_id) {
      // *************** add filter to query
      query.block_id = filter.block_id;
    }

    // *************** set default limit and offset
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? 20;

    // *************** get subjects based on query
    const subjects = await SubjectModel.find(query).skip(offset).limit(limit).sort({ created_at: -1 }).lean();
    return subjects;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllSubjects',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ filter, pagination }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active subject by its ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the subject to retrieve.
 * @returns {Promise<Object|null>} - Subject document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or database query fails.
 */
async function GetOneSubject(parent, { _id }) {
  try {
    // *************** validate subject's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // *************** get the subject document
    const subject = await SubjectModel.findOne({ _id, status: 'active' }).lean();

    // *************** check if subject document exist
    if (!subject) {
      throw new ApolloError("subject doesn't exist or already deleted");
    }
    return subject;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneSubject',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** MUTATION ****************
/**
 * Create a new subject after validating input.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Subject input fields.
 * @param {string} input.name - Name of subject.
 * @param {string} [input.description] - Description of subject.
 * @param {string} input.coefficient - Coefficient for calculation factor.
 * @returns {Promise<Object>} - Created subject document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function CreateSubject(parent, { input }) {
  try {
    // *************** validation to ensure bad input is handled correctly
    ValidateSubjectInput(input);

    // *************** check block existence in db
    const blockIsExist = await BlockModel.findOne({ _id: input.block_id, status: 'active' }).lean();
    if (!blockIsExist) {
      throw new ApolloError("block doesn't exist");
    }
    // *************** compose payload
    const newSubject = SubjectPayloadComposer(input);

    // *************** create subject with composed payload
    const createdSubject = await SubjectModel.create(newSubject);

    // *************** add subject's id to block's subject_ids field
    await BlockModel.updateOne({ _id: input.block_id }, { $addToSet: { subject_ids: createdSubject._id } });
    return createdSubject;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateSubject',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a subject document after validating subject's id and input.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the subject to update.
 * @param {object} input - BLock input fields.
 * @param {string} input.name - Name of subject.
 * @param {string} [input.description] - Description of subject.
 * @param {string} input.coefficient - Coefficient for calculation factor.
 * @returns {Promise<Object>} - Updated subject document.
 * @throws {ApolloError} - Throws error if validation or db operation fails.
 */
async function UpdateSubject(parent, { _id, input }) {
  try {
    // *************** validate subject's id
    ValidateMongoObjectId(_id);

    // *************** validation to ensure bad input is handled correctly
    ValidateSubjectInput(input);

    // *************** get the subject document
    const toBeUpdatedSubjectDocument = await SubjectModel.findOne({ _id, status: 'active' }).lean();
    if (!toBeUpdatedSubjectDocument) {
      throw new ApolloError("subject doesn't exist or already deleted");
    }

    // *************** check if block_id is changed, changing block_id is not allowed
    if (input.block_id !== String(toBeUpdatedSubjectDocument.block_id)) {
      throw new ApolloError('block_id cannot be changed');
    }

    // *************** compose payload
    const editedSubject = SubjectPayloadComposer(input);

    // *************** update subject with composed payload
    const updatedSubject = await SubjectModel.findOneAndUpdate({ _id }, { $set: editedSubject }, { new: true }).lean();
    return updatedSubject;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateSubject',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Add pass_conditions field into a specific subject
 * @param {Object} parent - Not used (GraphQL resolver convention).
 * @param {String} _id - _id of the block
 * @param {Array<Object>} input - an array of object containing pass/fail criteria
 * @param {String} input.parameter - pass condition's parameter to be used for conditional checking
 * @param {Number} input.parameter_value - pass condition's parameter_value to be used as comparator
 * @param {String} input.syllabus_type - pass condition's syllabus_type
 * @param {String} input.subject_id - id of Subject used within pass_conditions
 * @param {String} input.test_id - id of Test used within pass_conditions
 *@param  {String} input.math_operator - string representation of math_operator
 * @param {String} input.logical_operator - string representation of logical operator
 */
async function AddSubjectPassConditions(parent, { _id, input }) {
  try {
    // *************** validate block's id
    ValidateMongoObjectId(_id);

    // *************** validate subject's pass_conditions input
    ValidateSubjectPassConditionsInput(input);

    // *************** compose payload
    const subjectPassConditionsPayload = SubjectPassConditionsPayloadComposer(input);
    const addedPassConditions = await SubjectModel.findOneAndUpdate(
      { _id },
      { pass_conditions: subjectPassConditionsPayload },
      { new: true }
    );
    return addedPassConditions;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateSubject',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a subject by marking its status as 'deleted'.
 * Prevents deletion if subject is referenced by any subject, delete subject's id from block.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the subject to delete.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {ApolloError} - Throws error if unauthorized, subject not found, or subject is referenced.
 */
async function DeleteSubject(parent, { _id }) {
  try {
    // *************** validate subject's id
    ValidateMongoObjectId(_id);

    // *************** get the subject's document
    const toBeDeletedSubjectDocument = await SubjectModel.findOne({ _id, status: 'active' }).lean();

    if (!toBeDeletedSubjectDocument) {
      throw new ApolloError("subject doesn't exist or already deleted");
    }

    // *************** check if the subject document is referenced by subject
    if (toBeDeletedSubjectDocument.test_ids?.length) {
      throw new ApolloError('subject that is referenced by test cannot be deleted');
    }

    // *************** soft delete the subject by updating status and deleted_at
    await SubjectModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_at: new Date() } });

    // *************** remove subject's id from subject_ids field in subject
    await BlockModel.updateOne({ _id: toBeDeletedSubjectDocument.block_id }, { $pull: { subject_ids: _id } });

    return 'subject deleted succesfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteSubject',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the block_id field in a School document using DataLoader.
 * @async
 * @param {object} parent - The subject object containing block_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.block - DataLoader instance for blocks.
 * @returns {Promise<Object|null>} - The subject document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function block_id(parent, args, context) {
  try {
    // *************** check if subject has any block_id
    if (!parent?.block_id) {
      return null;
    }

    // *************** load user
    const loadedBlock = await context.loaders.block.load(parent.block_id);
    return loadedBlock;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'block_id',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the block_id field in a subject document using DataLoader.
 * @async
 * @param {object} parent - The subject object containing test_ids field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.test - DataLoader instance for tests.
 * @returns {Promise<Object|null>} - The test document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function test_ids(parent, args, context) {
  try {
    // *************** check if subject has any test_ids
    if (!parent?.test_ids) {
      return null;
    }

    // *************** load user
    const loadedTest = await context.loaders.test.loadMany(parent.test_ids);
    return loadedTest;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'test_ids',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the test_id field in pass_conditions field in subject document using DataLoader.
 * @async
 * @param {object} parent - The passcondition object containing test_id field.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - Resolver context containing DataLoaders.
 * @param {object} context.loaders.test - DataLoader instance for tests.
 * @returns {Promise<Object|null>} - The test document or null if not available.
 * @throws {ApolloError} - Throws error if loading fails.
 */
async function test_id(parent, _, context) {
  try {
    if (!parent?.test_id) return null;
    return await context.loaders.test.load(parent.test_id);
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'test_id',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllSubjects, GetOneSubject },
  Mutation: { CreateSubject, UpdateSubject, AddSubjectPassConditions, DeleteSubject },
  Subject: {
    block_id,
    test_ids,
  },
  SubjectPassCondition: {
    test_id,
  },
};
