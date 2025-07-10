// *************** IMPORT MODULE ***************
const { StudentLoader } = require('../modules/student/student.loader');
const { SchoolLoader } = require('../modules/school/school.loader');
const { UserLoader } = require('../modules/user/user.loader');
const { BlockLoader } = require('../modules/block/block.loader');

/**
 * Initialize and return DataLoader instances for batching and caching to prevent N+1 queries.
 * It returns:
 * - {DataLoader} student - DataLoader instance for students
 * - {DataLoader} school - DataLoader instance for schools
 * - {DataLoader} user - DataLoader instance for users
 * @returns {Object} An object containing DataLoader instances.
 */
function InitializeDataloaders() {
  return { student: StudentLoader(), school: SchoolLoader(), user: UserLoader(), block: BlockLoader() };
}

// *************** EXPORT MODULE ***************
module.exports = InitializeDataloaders;
