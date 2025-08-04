// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Build an aggregation pipeline for querying Student documents with filtering, sorting, and pagination.
 * @param {Object} params - The input parameters.
 * @param {number} params.skip - Number of documents to skip (for pagination).
 * @param {number} params.limit - Number of documents to return (for pagination).
 * @param {Object} [params.filterInput] - Filtering criteria (school_id, student_name, date_of_birth, school_long_name).
 * @param {Object} [params.sortOption ]- Sort criteria for the result.
 * @throws {ApolloError} If any required parameter is missing or invalid.
 * @returns {Array<Object>} A MongoDB aggregation pipeline array.
 */
function StudentAggregatePipelineQueryBuilder({ skip, limit, filterInput, sortInput }) {
  // *************** sanity check for all of input object parameter
  if (typeof skip !== 'number') throw new ApolloError('skip is required and must be a number');
  if (!limit || typeof limit !== 'number') throw new ApolloError('limit is required and must be a number');
  if (filterInput && typeof filterInput !== 'object') throw new ApolloError('filterInput is required and must be an object');

  // *************** map the sort option
  const sortOption = {};
  const sortFieldMap = {
    first_name: 'first_name',
    last_name: 'last_name',
    school_long_name: 'school_documents.long_name',
    date_of_birth: 'date_of_birth',
    created_at: 'created_at',
  };

  // *************** set default value for sortField
  const sortField = sortFieldMap[sortInput?.sort_by] || 'created_at';

  // *************** set default value for sortOrder
  const sortOrder = sortInput?.sort_order === 'desc' ? -1 : 1;

  sortOption[sortField] = sortOrder;

  // *************** empty array for pipeline query
  const pipeline = [];

  // *************** START: Student match stage query ***************
  const studentMatchStage = { status: 'active' };

  if (filterInput?.school_id) studentMatchStage.school_id = filterInput.school_id;
  if (filterInput?.student_name) {
    const studentNameRegex = new RegExp(filterInput.student_name, 'i');
    studentMatchStage.$or = [{ first_name: studentNameRegex }, { last_name: studentNameRegex }];
  }
  if (filterInput?.date_of_birth) {
    const operatorMap = {
      greater_than: '$gt',
      greater_than_equal: '$gte',
      equal: '$eq',
      less_than: '$lt',
      less_than_equal: '$lte',
    };

    const dateComparationOperator = operatorMap[filterInput.date_comparation_operator];
    studentMatchStage.date_of_birth = { [dateComparationOperator]: new Date(filterInput.date_of_birth) };
  }

  pipeline.push({ $match: studentMatchStage });
  // *************** END: Match stage query pushed ***************

  // *************** START: Lookup for school ***************
  const isLookupNeeded = filterInput?.school_long_name || sortInput?.sort_by === 'school_long_name';
  if (isLookupNeeded) {
    pipeline.push({
      $lookup: {
        from: 'schools',
        localField: 'school_id',
        foreignField: '_id',
        as: 'school_documents',
      },
    });
    pipeline.push({ $unwind: '$school_documents' });

    if (filterInput?.school_long_name) {
      const schoolLongNameRegex = new RegExp(filterInput.school_long_name, 'i');
      pipeline.push({
        $match: {
          'school_documents.long_name': schoolLongNameRegex,
        },
      });
    }
  }
  // *************** END: Lookup query pushed ***************

  // *************** START: Add pagination to query ***************
  pipeline.push({
    $facet: {
      data: [{ $sort: sortOption }, { $skip: skip }, { $limit: limit }],
      total_count: [{ $count: 'count' }],
    },
  });
  // *************** END: Pagination pushed to pipeline ***************
  return pipeline;
}

// *************** EXPORT MODULE ***************
module.exports = { StudentAggregatePipelineQueryBuilder };
