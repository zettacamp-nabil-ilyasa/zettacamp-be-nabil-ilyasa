// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SubjectModel = require('./subject.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***********************
const { ValidateSubjectInput } = require('./subject.validators.js');
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

// *************** IMPORT HELPER ***********************
const { SubjectPayloadComposer } = require('./subject.helper.js');
// **************** QUERY ****************
/**
 * Get all subjects with optional filtering by subject_id and pagination.
 * @async
 * @function GetAllSubjects
 * @param {Object} params - The parameter object
 * @param {Object} [filterInput] - Optional filter input
 * @param {string} [filterInput.subject_id] - Optional subject ID to filter subjects
 * @param {Object} [paginationInput] - Optional pagination input
 * @param {number} [paginationInput.limit] - Number of subjects per page
 * @param {number} [paginationInput.offset] - Number of subjects to skip
 * @returns {Promise<Array<Object>>} Array of subject documents matching the query
 * @throws {ApolloError} If any error occurs during validation or database operation
 */
async function GetAllSubjects({ filterInput, paginationInput }) {
  try {
    // **************** construct base query
    const query = { status: 'active' };

    // **************** check if filter input provided
    if (filterInput.subject_id) {
      // **************** validate subject's _id, ensure that it can be casted into valid ObjectId
      ValidateMongoObjectId(filterInput.subject_id);

      // **************** add filter to query
      query.subject_id = filterInput.subject_id;
    }

    // **************** get subjects based on query
    const subjects = await SubjectModel.find(query)
      .skip(paginationInput.offset || 0)
      .limit(paginationInput.limit || 20)
      .lean();
    return subjects;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllSubjects',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({}),
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
async function GetOneSubject({ _id }) {
  try {
    // **************** validate subject's _id, ensure that it can be casted into valid ObjectId
    ValidateMongoObjectId(_id);

    // **************** get the subject document
    const subject = await SubjectModel.find({ _id, status: 'active' }).lean();

    // **************** check if subject document exist
    if (!subject) {
      throw new ApolloError("subject doesn't exist or already deleted");
    }
    return subject;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneSubject',
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// **************** MUTATION ****************
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
async function CreateSubject({ input }) {
  // *************** validation to ensure bad input is handled correctly
  ValidateSubjectInput(input, { checksubjectId: true });

  // *************** compose payload
  const newSubject = SubjectPayloadComposer(input, { checkSubjectId: true });

  // *************** create subject with composed payload
  const createdSubject = SubjectModel.create(newSubject);
  return createdSubject;
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
async function UpdateSubject({ _id, input }) {
  // *************** validate subject's id
  ValidateMongoObjectId(_id);

  // *************** validation to ensure bad input is handled correctly
  ValidateSubjectInput(input);

  // *************** compose payload
  const editedSubject = SubjectPayloadComposer(input);

  // *************** update subject with composed payload
  const updatedSubject = await SubjectModel.findOneAndUpdate({ _id }, { $set: editedSubject }, { new: true }).lean();
  return updatedSubject;
}
