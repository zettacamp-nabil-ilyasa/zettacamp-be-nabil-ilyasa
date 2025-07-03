// *************** IMPORT MODULE ***************
const { StudentLoader } = require('../modules/student/student.loader');
const { SchoolLoader } = require('../modules/school/school.loader');
const { UserLoader } = require('../modules/user/user.loader');

/**
 * Initialize and return DataLoader instances for batching and caching to prevent N+1 queries.
 * @returns {Object} An object containing DataLoader instances:
 * - {DataLoader} student - DataLoader instance for students
 * - {DataLoader} school - DataLoader instance for schools
 * - {DataLoader} user - DataLoader instance for users
 */
function InitializeDataloaders() {
  return { student: StudentLoader(), school: SchoolLoader(), user: UserLoader() };
}

// *************** EXPORT MODULE ***************
module.exports = InitializeDataloaders;
