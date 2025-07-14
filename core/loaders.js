// *************** IMPORT MODULE ***************
const { StudentLoader } = require('../modules/student/student.loader');
const { SchoolLoader } = require('../modules/school/school.loader');
const { UserLoader } = require('../modules/user/user.loader');
const { BlockLoader } = require('../modules/block/block.loader');
const { SubjectLoader } = require('../modules/subject/subject.loader');
const { TestLoader } = require('../modules/test/test.loader');
const { TaskLoader } = require('../modules/task/task.loader');
const { StudentTestResultLoader } = require('../modules/studenTestResult/student_test_result.loader');

/**
 * Initialize and return DataLoader instances for batching and caching to prevent N+1 queries.
 * It returns:
 * - {DataLoader} student - DataLoader instance for students
 * - {DataLoader} school - DataLoader instance for schools
 * - {DataLoader} user - DataLoader instance for users
 * - {DataLoader} block - DataLoader instance for blocks
 * - {DataLoader} subject - DataLoader instance for subjects
 * - {DataLoader} test - DataLoader instance for tests
 * - {DataLoader} task - DataLoader instance for tasks
 * - {DataLoader} studentTestResult - DataLoader instance for student test results
 * @returns {Object} An object containing DataLoader instances.
 */
function InitializeDataloaders() {
  return {
    student: StudentLoader(),
    school: SchoolLoader(),
    user: UserLoader(),
    block: BlockLoader(),
    subject: SubjectLoader(),
    test: TestLoader(),
    task: TaskLoader(),
    studentTestResult: StudentTestResultLoader(),
  };
}

// *************** EXPORT MODULE ***************
module.exports = InitializeDataloaders;
