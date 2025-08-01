// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 * Build a MongoDB aggregation pipeline for querying School documents
 * @param {Object} params - Parameters for building the aggregation pipeline.
 * @param {Object} [skip] - Pagination options for skip.
 * @param {Object} [limit] - Pagination options for limit.
 * @param {Object} [filterInput] - Filter options for the query.
 * @param {string} [filterInput.country] - Filter by country field of School.
 * @param {string} [filterInput.student_name] - Search student first or last name with case-insensitive partial match.
 * @param {Object} [sortInput] - Sort options for the query.
 * @param {'long_name'|'brand_name'|'created_at'} [sortInput.sort_by] - Field to sort by.
 * @param {'asc'|'desc'} [sortInput.sort_order] - Sort direction, ascending or descending.
 * @returns {Array<Object>} Aggregation pipeline stages for querying School collection.
 */
function SchoolAggregatePipelineQueryBuilder({ skip, limit, filterInput, sortInput }) {
  // *************** sanity check for all of input object parameter
  if (!skip || typeof skip !== 'number') throw new ApolloError('skip is required and must be a number');
  if (!limit || typeof limit !== 'number') throw new ApolloError('limit is required and must be a number');
  if (typeof filterInput !== 'object') throw new ApolloError('filterInput is required and must be an object');

  // *************** object for sort field mapping
  const sortOption = {};
  const sortFieldMap = {
    long_name: 'long_name',
    brand_name: 'brand_name',
    created_at: 'created_at',
  };

  // *************** set default value for sortField
  const sortField = sortFieldMap[sortInput?.sort_by] || 'created_at';

  // *************** set default value for sortOrder
  const sortOrder = sortInput?.sort_order === 'desc' ? -1 : 1;

  // *************** inser sort data into sortOption object
  sortOption[sortField] = sortOrder;

  // *************** empty array for pipeline query
  const pipeline = [];

  // *************** START: School match stage query ***************
  const schoolMatchStage = { status: 'active' };

  // *************** query for match stage within schools, push to pipeline
  if (filterInput?.country) {
    countryNameRegex = new RegExp(filterInput.country, 'i');
    schoolMatchStage.country = countryNameRegex;
  }
  pipeline.push({ $match: schoolMatchStage });
  // *************** END: Match stage query pushed  ***************

  // *************** START: Lookup for school ***************
  if (filterInput?.student_name) {
    pipeline.push({
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'school_id',
        as: 'students',
      },
    });

    // *************** set query for second match stage within students
    const studentNameRegex = new RegExp(filterInput.student_name, 'i');
    pipeline.push({
      $match: {
        $or: [{ 'students.last_name': studentNameRegex }, { 'students.first_name': studentNameRegex }],
      },
    });
  }
  // *************** END: Lookup query pushed ***************

  // *************** START: Add pagination to query ***************
  pipeline.push({
    $facet: {
      data: [{ $sort: sortOption }, { $skip: skip }, { $limit: limit }],
      total_count: [{ $count: 'count' }],
    },
  });
  // *************** END: Pagination pushed to pipeline  ***************
  return pipeline;
}

// *************** EXPORT MODULE ***************
module.exports = { SchoolAggregatePipelineQueryBuilder };
