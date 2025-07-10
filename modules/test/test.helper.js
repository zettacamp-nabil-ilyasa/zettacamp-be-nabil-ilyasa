/**
 * Get total weight of all tests that referenced the same subject_id
 * @param {string} subjectId - Id of subject referenced by test
 * @returns {number} - Sum of tests weight
 */
async function GetTotalWeightOfTests(subjectId) {
  // *************** validate subject_id
  ValidateMongoObjectId(subjectId);

  // *************** cast subject_id to ObjectId
  const subjectObjectId = Mongoose.Types.ObjectId(subjectId);

  // *************** build aggregation query to get the weight of all tests referenced the same subject_id
  const aggQuery = [{ $match: { subject_id: subjectObjectId } }, { $group: { $id: null, total_weight: { $sum: '$weight' } } }];

  // *************** execute the query
  const totalWeight = await TestModel.aggregate(aggQuery);
  return totalWeight;
}
