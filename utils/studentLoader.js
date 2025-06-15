//*************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

//*************** IMPORT MODULE ***************
const Student = require('../graphql/student/student.model.js');

/**
 * Batch function to load students by array of school IDs.
 * Groups the results in the same order as the input `schoolIds`.
 * @param {Array<string>} schoolIds - Array of school IDs
 * @returns {Promise<Array<Array<Object>>>} - Array of an array of students for the corresponding school ID
 * @throws {Error} - Throws error if the database query fails
 */
async function batchStudentsBySchoolId(schoolIds) {
  try {
    const students = await Student.find({ school_id: { $in: schoolIds }, status: { $ne: 'deleted' } });
    //*************** group students by school_id
    const studentsGrouped = schoolIds.map((schoolId) => students.filter((student) => student.school_id.toString() === schoolId.toString()));
    return studentsGrouped;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Batch function to load students by array of user IDs.
 * Returns a single student (if any) per user, in the same order as input `userIds`.
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Array<Object|null>>} - Array of student objects or null, corresponding to each user ID
 * @throws {Error} - Throws error if the database query fails
 */
async function batchStudentByUserId(userIds) {
  try {
    const students = await Student.find({ user_id: { $in: userIds }, status: { $ne: 'deleted' } });
    //*************** group students by user_id
    const studentsGrouped = userIds.map((userId) => students.find((student) => student.user_id.toString() === userId.toString()));
    return studentsGrouped;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Creates a DataLoader instance to batch and cache student records by school ID.
 * @returns {DataLoader<string, Array<Object>>} A DataLoader that returns an array of students for each school ID
 */
function StudentBySchoolLoader() {
  const studentLoader = new DataLoader(batchStudentsBySchoolId);
  return studentLoader;
}

/**
 * Creates a DataLoader instance to batch and cache student records by user ID.
 * @returns {DataLoader<string, Object>} A DataLoader that returns a single student for each user ID
 */
function StudentByUserLoader() {
  const studentLoader = new DataLoader(batchStudentByUserId);
  return studentLoader;
}

module.exports = { StudentBySchoolLoader, StudentByUserLoader };
