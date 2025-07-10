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

async function GetAllTests({ filterInput, paginationInput }) {
  try {
    // **************** construct base query
    const query = { status: 'active' };

    // **************** check if filter input provided
    if (filterInput.subject_id) {
      // **************** validate subject's _id, ensure that it can be casted into valid ObjectId
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
      path: '/modules/subject/subject.resolver.js',
      parameter_input: JSON.stringify({ filterInput, paginationInput }),
    });
    throw new ApolloError(error.message);
  }
}
