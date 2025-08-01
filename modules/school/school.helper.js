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
function SchoolAggregatePipelineQueryBuilder({ skip, limit, filterInput, sortOption }) {
  // *************** empty array for pipeline query
  const pipeline = [];

  // *************** base query
  const schoolMatchStage = {
    status: 'active',
  };

  // *************** query for match stage within schools, push to pipeline
  if (filterInput?.country) schoolMatchStage.country = filterInput.country;
  pipeline.push({ $match: schoolMatchStage });

  // *************** query for lookup to get students documents
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

  const pagedPipeline = [
    ...pipeline,
    {
      $facet: {
        data: [{ $sort: sortOption }, { $skip: skip }, { $limit: limit }],
        total_count: [{ $count: 'count' }],
      },
    },
  ];

  return pagedPipeline;
}

// *************** EXPORT MODULE ***************
module.exports = { SchoolAggregatePipelineQueryBuilder };
