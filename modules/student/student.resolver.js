// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const SchoolModel = require('../school/school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateStudentInput, ValidateUniqueStudentEmail } = require('./student.validators.js');
const { ValidateSchoolExistence } = require('../../utilities/validators/school-validator.js');
const { ValidateId } = require('../../utilities/validators/mongo-validator.js');

// *************** QUERY ***************
/**
 * Get all active students from the database.
 * @async
 * @returns {Promise<Array<Object>>} - Array of student documents with status 'active'.
 * @throws {ApolloError} - Throws error if query fails or database operation encounters issues.
 */
async function GetAllStudents() {
  try {
    const students = await StudentModel.find({ status: 'active' }).lean();
    return students;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllStudents',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active student by ID.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student to retrieve.
 * @returns {Promise<Object|null>} - The Student document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or student not found.
 */
async function GetOneStudent(parent, { _id }) {
  try {
    // **************** validate student's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    const student = await StudentModel.findOne({ _id: _id, status: 'active' }).lean();

    // **************** throw error if there's no student to returned
    if (!student) {
      throw new ApolloError('cannot get the requested student');
    }
    return student;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** MUTATION ***************
/**
 * Create a new student after validating input and checking constraints.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} input - Student input fields.
 * @param {string} input.email - Student's email address.
 * @param {string} input.first_name - Student's first name.
 * @param {string} input.last_name - Student's last name.
 * @param {string} input.school_id - ID of the school the student belongs to.
 * @param {string} input.date_of_birth - Student's date of birth as a string.
 * @param {string} input.created_by - User ID of the admin who creates the student.
 * @returns {Promise<Object>} - The newly created student document.
 * @throws {ApolloError} - Throws error if validation fails or email/school is invalid.
 */
async function CreateStudent(parent, { input }) {
  try {
    // **************** validate school_id, ensure that it can be casted into valid ObjectId
    ValidateId(input.school_id);

    // *************** validation to ensure fail-fast and bad input is handled correctly
    ValidateStudentInput(input);

    // *************** check if email already used by another student
    await ValidateUniqueStudentEmail({ studentEmail: input.email });

    // *************** check if school is exist
    await ValidateSchoolExistence(input.school_id);

    // *************** compose new object from input
    const newStudent = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      school_id: input.school_id,
      date_of_birth: input.date_of_birth,
    };

    // *************** set static User id for created_by field
    const createdByUserId = '6862150331861f37e4e3d209';
    newStudent.created_by = createdByUserId;

    // *************** create student with composed object
    const createdStudent = await StudentModel.create(newStudent);

    // *************** add created student id to student array in school document
    await SchoolModel.updateOne({ _id: newStudent.school_id }, { $addToSet: { students: createdStudent._id } });

    return createdStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a student's information after validating input and checking existence.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} input.email - New email address.
 * @param {string} input.first_name - Updated first name.
 * @param {string} input.last_name - Updated last name.
 * @param {string} [input.date_of_birth] - Updated date of birth in string format (optional).
 * @param {string} input.school_id - School ID.
 * @returns {Promise<Object>} - Updated student document.
 * @throws {ApolloError} - Throws error if student does not exist, email already used, or school not found.
 */
async function UpdateStudent(parent, { _id, input }) {
  try {
    // **************** validate student's _id and school_id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);
    ValidateId(input.school_id);

    // **************** validation to ensure bad input is handled correctly
    ValidateStudentInput(input);

    // **************** get the student document
    const toBeUpdatedStudentDocument = await StudentModel.findOne({ _id }).lean();

    // **************** check if the student is exist
    if (!toBeUpdatedStudentDocument) {
      throw new ApolloError('Student does not exist');
    }

    // **************** check if email already used by another student
    await ValidateUniqueStudentEmail({ studentId: _id, studentEmail: input.email });

    // **************** check if school is exist
    await ValidateSchoolExistence(input.school_id);

    // **************** compose new object from input
    let editedStudent = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      date_of_birth: input.date_of_birth,
      school_id: input.school_id,
    };

    // **************** get student's current school_id from the document
    const oldSchoolId = toBeUpdatedStudentDocument.school_id;

    // **************** check if current school id is different from edited school id (changed school id)
    if (String(toBeUpdatedStudentDocument.school_id) !== editedStudent.school_id) {
      // **************** remove the student's id from previous school and add it to new school
      await SchoolModel.bulkWrite([
        {
          updateOne: {
            filter: { _id: oldSchoolId },
            update: { $pull: { students: _id } },
          },
        },
        {
          updateOne: {
            filter: { _id: editedStudent.school_id },
            update: { $addToSet: { students: _id } },
          },
        },
      ]);

      // ****************  remove student's id from previous school
      await SchoolModel.updateOne({ _id: oldSchoolId }, { $pull: { students: _id } });

      // **************** add student's id to new school
      await SchoolModel.updateOne({ _id: editedStudent.school_id }, { $addToSet: { students: _id } });
    }

    // **************** update student with composed object
    const updatedStudent = await StudentModel.findOneAndUpdate({ _id }, { $set: editedStudent }, { new: true }).lean();
    return updatedStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id, input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a student by marking their status as 'deleted' and removing them from associated school.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {string} _id - ID of the student to delete.
 * @returns {Promise<string>} - Success message upon deletion.
 * @throws {ApolloError} - Throws error if unauthorized or student not found.
 */
async function DeleteStudent(parent, { _id }) {
  try {
    // **************** validate student's _id, ensure that it can be casted into valid ObjectId
    ValidateId(_id);

    // **************** check if the to be deleted student is exist
    const studentIsExist = StudentModel.findOne({ _id }).lean();
    if (!studentIsExist) {
      throw new ApolloError("student doesn't exist or already deleted");
    }
    // **************** set static User id for deleted_by
    const deletedByUserId = '6862150331861f37e4e3d209';

    // **************** remove student_id from student array in school document
    await SchoolModel.updateOne({ students: _id }, { $pull: { students: _id } });

    // **************** soft delete student by updating it with composed object
    await StudentModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by: deletedByUserId, deleted_at: new Date() } });
    return 'Student deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************
/**
 * Resolve the school_id field in a Student by using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - The parent student document.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - GraphQL context containing DataLoaders.
 * @returns {Promise<Object|null>} - The related school document or null if not found.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function school_id(parent, args, context) {
  try {
    // *************** check if student has any school_id
    if (!parent?.school_id) {
      return null;
    }

    // *************** load school
    const loadedSchool = await context.loaders.school.load(parent.school_id);
    return loadedSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'school_id',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a Student by using DataLoader to prevent N+1 queries.
 * @async
 * @param {object} parent - The parent student document.
 * @param {object} args - Not used (GraphQL resolver convention).
 * @param {object} context - GraphQL context containing DataLoaders.
 * @returns {Promise<Object|null>} - The related user document or null if not found.
 * @throws {ApolloError} - Throws error if DataLoader fails.
 */
async function created_by(parent, args, context) {
  try {
    // *************** check if student has any created_by
    if (!parent?.created_by) {
      return null;
    }

    // *************** load user
    const loadedUser = await context.loaders.user.load(parent.created_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'created_by',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudents, GetOneStudent },
  Mutation: { CreateStudent, UpdateStudent, DeleteStudent },
  Student: {
    created_by,
    school_id,
  },
};
