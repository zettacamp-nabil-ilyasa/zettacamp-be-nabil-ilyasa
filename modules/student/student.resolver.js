// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const StudentModel = require('./student.model.js');
const SchoolModel = require('../school/school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTILS ***************
const { SchoolIsExist } = require('../../shared/utils/school.js');
const { ValidateId } = require('../../utilities/common-validator/mongo-validator.js');

// *************** IMPORT VALIDATORS ***************
const { ValidateStudentUpdateInput, ValidateStudentCreateInput } = require('./student.validators.js');

// *************** IMPORT HELPERS ***************
const {
  StudentIsExist,
  StudentEmailIsExist,
  GetStudentCurrentSchoolId,
  GenerateBulkQueryForSchoolIdChange,
  ConvertStringToDate,
} = require('./student.helpers.js');

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
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the student to retrieve.
 * @returns {Promise<Object|null>} - The student document or null if not found.
 * @throws {ApolloError} - Throws error if validation fails or student not found.
 */

async function GetOneStudent(parent, { _id }) {
  try {
    //**************** validate _id
    ValidateId(_id);

    const student = await StudentModel.findOne({ _id: _id, status: 'active' }).lean();
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
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Input object to create a new student.
 * @param {string} args.input.email - Student's email address.
 * @param {string} args.input.first_name - Student's first name.
 * @param {string} args.input.last_name - Student's last name.
 * @param {string} args.input.school_id - ID of the school the student belongs to.
 * @param {string} [args.input.date_of_birth] - Student's date of birth as a string (optional, can be empty string).
 * @param {string} args.input.created_by - User ID of the admin who creates the student.
 * @returns {Promise<Object>} - The newly created student document.
 * @throws {ApolloError} - Throws error if validation fails or email/school is invalid.
 */
async function CreateStudent(parent, { input }) {
  try {
    // *************** compose new object from input
    let newStudent = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      school_id: input.school_id,
      // *************** set date_of_birth to undefined if it's an empty string
      date_of_birth: typeof input.date_of_birth === 'string' && input.date_of_birth.trim() === '' ? undefined : input.date_of_birth,
      created_by: input.created_by,
    };

    // *************** validation to ensure bad input is handled correctly
    ValidateStudentCreateInput(newStudent);

    // *************** check if email already exists
    const emailIsExist = await StudentEmailIsExist({ studentEmail: newStudent.email });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    // *************** check if school to delete is exist
    const schoolIsExist = await SchoolIsExist(newStudent.school_id);
    if (!schoolIsExist) {
      throw new ApolloError('School does not exist');
    }

    // *************** convert string value to Date and assign to date_of_birth
    if (newStudent.date_of_birth) {
      newStudent.date_of_birth = ConvertStringToDate(newStudent.date_of_birth);
    }

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
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Student update fields.
 * @param {string} args.input._id - ID of the student to update.
 * @param {string} [args.input.email] - New email address (optional).
 * @param {string} [args.input.first_name] - Updated first name (optional).
 * @param {string} [args.input.last_name] - Updated last name (optional).
 * @param {string} [args.input.date_of_birth] - Updated date of birth in string format (optional).
 * @param {string} [args.input.school_id] - New school ID (optional).
 * @returns {Promise<Object>} - Updated student document.
 * @throws {ApolloError} - Throws error if student does not exist, email already used, or school not found.
 */
async function UpdateStudent(parent, { input }) {
  try {
    //**************** compose new object from input
    let editedStudent = {
      _id: input._id,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      //**************** set date_of_birth to undefined if it's an empty string
      date_of_birth: typeof input.date_of_birth === 'string' && input.date_of_birth.trim() === '' ? undefined : input.date_of_birth,
      school_id: input.school_id,
    };

    //**************** validation to ensure bad input is handled correctly
    ValidateStudentUpdateInput(editedStudent);

    //**************** check if student is exist
    const studentIsExist = await StudentIsExist(editedStudent._id);
    if (!studentIsExist) {
      throw new ApolloError('Student does not exist');
    }

    //**************** check if email already exists
    if (editedStudent.email) {
      const emailIsExist = await StudentEmailIsExist({ studentEmail: editedStudent.email, studentId: editedStudent._id });
      if (emailIsExist) {
        throw new ApolloError('Email already exist');
      }
    }

    //**************** check if schoolId is provided and is exist
    if (editedStudent.school_id) {
      //**************** check if school is exist
      const schoolIsExist = await SchoolIsExist(editedStudent.school_id);
      if (!schoolIsExist) {
        throw new ApolloError('School does not exist');
      }

      const studentCurrentSchoolId = await GetStudentCurrentSchoolId(editedStudent._id);
      //**************** check if current school id is different from edited school id (changed school id)
      if (String(studentCurrentSchoolId) !== editedStudent.school_id) {
        const bulkQuery = GenerateBulkQueryForSchoolIdChange({
          studentId: editedStudent._id,
          newSchoolId: editedStudent.school_id,
          oldSchoolId: studentCurrentSchoolId,
        });
        if (!bulkQuery.length) {
          throw new ApolloError('Failed to generate bulk query');
        }
        await SchoolModel.bulkWrite(bulkQuery);
      }
    }

    //**************** check if date_of_birth is provided and convert validated string value to date
    if (editedStudent.date_of_birth) {
      editedStudent.date_of_birth = ConvertStringToDate(editedStudent.date_of_birth);
    }

    //**************** update student with composed object
    const updatedStudent = await StudentModel.findOneAndUpdate({ _id: editedStudent._id }, { $set: editedStudent }, { new: true }).lean();
    return updatedStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a student by marking their status as 'deleted' and removing them from associated school.
 * @async
 * @param {object} parent - Not used (GraphQL resolver convention).
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the student to delete.
 * @param {string} args.deleted_by - ID of the admin who deletes the student.
 * @returns {Promise<string>} - Success message upon deletion.
 * @throws {ApolloError} - Throws error if unauthorized or student not found.
 */
async function DeleteStudent(parent, { _id, deleted_by }) {
  try {
    //**************** validate id and deleted_by
    ValidateId(_id);
    ValidateId(deleted_by);

    //**************** check if student to be deleted is exist
    const studentIsExist = await StudentIsExist(_id);
    if (!studentIsExist) {
      throw new ApolloError('Student does not exist');
    }

    //**************** remove student_id from student array in school document
    await SchoolModel.updateOne({ students: _id }, { $pull: { students: _id } });

    //**************** soft delete student by updating it with composed object
    await StudentModel.updateOne({ _id }, { $set: { status: 'deleted', deleted_by, deleted_at: new Date() } });
    return 'Student deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteStudent',
      path: '/modules/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id, deleted_by }),
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

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudents, GetOneStudent },
  Mutation: { CreateStudent, UpdateStudent, DeleteStudent },
  Student: {
    school_id,
  },
};
