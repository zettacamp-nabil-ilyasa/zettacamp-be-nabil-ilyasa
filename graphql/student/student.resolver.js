// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULES ***************
const StudentModel = require('./student.model.js');
const SchoolModel = require('../school/school.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT UTILS ***************
const { SchoolIsExist, FormatDateToDisplayString } = require('../../utils/common.js');
const { ValidateId, UserIsAdmin } = require('../../utils/common-validator.js');

// *************** IMPORT VALIDATORS ***************
const { ValidateStudentUpdateInput, ValidateStudentCreateInput } = require('./student.validators.js');

// *************** IMPORT HELPERS ***************
const { StudentIsExist, StudentEmailIsExist, GetPreviousSchoolId } = require('./student.helpers.js');

//*************** QUERY ***************

/**
 * Get all active students from the database.
 * @returns {Promise<Array<Object>>} - Array of student documents.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllStudents() {
  try {
    const students = await StudentModel.find({ status: 'active' }).lean();
    return students;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetAllStudents',
      path: '/graphql/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Get one active student by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the student to retrieve.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if validation or db operation fails.
 */
async function GetOneStudent(_, { _id }) {
  try {
    //**************** validate _id
    ValidateId(_id);

    const student = await StudentModel.findOne({ _id: _id, status: 'active' }).lean();
    return student;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'GetOneStudent',
      path: '/graphql/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id }),
    });
    throw new ApolloError(error.message);
  }
}

//*************** MUTATION ***************

/**
 * Create a new student after validating input and checking email.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Student input fields.
 * @returns {Promise<Object>} - Created student document.
 * @throws {Error} - Throws error if validation or db operation fails.
 */
async function CreateStudent(_, { input }) {
  try {
    //*************** validation to ensure bad input is handled correctly
    const validatedStudentInput = ValidateStudentCreateInput(input);

    const { created_by, email, first_name, last_name, school_id, date_of_birth } = validatedStudentInput;

    //*************** check if deleter user is exist and has admin role
    const userIsAdmin = await UserIsAdmin(created_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //*************** check if email already exists
    const emailIsExist = await StudentEmailIsExist({ studentEmail: email });
    if (emailIsExist) {
      throw new ApolloError('Email already exist');
    }

    //*************** check if school to delete is exist
    const schoolIsExist = await SchoolIsExist(school_id);
    if (!schoolIsExist) {
      throw new ApolloError('School does not exist');
    }

    //*************** compose object with validated input for Student
    const validatedSchool = {
      email,
      first_name,
      last_name,
      school_id,
      date_of_birth,
      status: 'active',
      created_by,
    };

    //*************** create student with composed object
    const createdStudent = await StudentModel.create(validatedSchool);

    //*************** add created student id to student array in school document
    await SchoolModel.updateOne({ _id: school_id }, { $addToSet: { students: createdStudent._id } });

    return createdStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateStudent',
      path: '/graphql/student/student.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Update a student after validating input and checking existence
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Student update fields.
 * @returns {Promise<Object>} - Updated student document.
 * @throws {Error} - Throws error if validation or db operation fails.
 */
async function UpdateStudent(_, { input }) {
  try {
    //**************** validation to ensure bad input is handled correctly
    const validatedStudentInput = ValidateStudentUpdateInput(input);
    const { _id, email, first_name, last_name, date_of_birth, school_id } = validatedStudentInput;

    //**************** check if student is exist
    const studentIsExist = await StudentIsExist(_id);
    if (!studentIsExist) {
      throw new ApolloError('Student does not exist');
    }

    //**************** check if email already exists
    if (email) {
      const emailIsExist = await StudentEmailIsExist({ studentEmail: email, studentId: _id });
      if (emailIsExist) {
        throw new ApolloError('Email already exist');
      }
    }

    //**************** check if school is exist
    if (school_id) {
      const schoolIsExist = await SchoolIsExist(school_id);
      if (!schoolIsExist) {
        throw new ApolloError('School does not exist');
      }

      //**************** remove student id from student array in previous school
      const previousSchoolId = await GetPreviousSchoolId(_id);
      if (previousSchoolId) {
        if (previousSchoolId != school_id) {
          await SchoolModel.updateOne({ _id: previousSchoolId }, { $pull: { students: _id } });
        }
      }
      //**************** add student id to student array in school document
      await SchoolModel.updateOne({ _id: school_id }, { $addToSet: { students: _id } });
    }
    //**************** compose object with validated input for Student
    const validatedStudent = {};
    if (email) {
      validatedStudent.email = email;
    }
    if (first_name) {
      validatedStudent.first_name = first_name;
    }
    if (last_name) {
      validatedStudent.last_name = last_name;
    }
    if (date_of_birth != null && date_of_birth != undefined) {
      validatedStudent.date_of_birth = date_of_birth;
    }
    if (school_id) {
      validatedStudent.school_id = school_id;
    }

    //**************** update student with composed object
    const updatedStudent = await StudentModel.findOneAndUpdate({ _id: _id }, validatedStudent, { new: true }).lean();
    return updatedStudent;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'UpdateStudent',
      path: '/graphql/student/student.resolver.js',
      parameter_input: JSON.stringify({ input }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Soft delete a student by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the student to delete.
 * @param {string} args.deleted_by - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or student not found.
 */
async function DeleteStudent(_, { _id, deleted_by }) {
  try {
    //**************** validate id and deleted_by
    ValidateId(_id);
    ValidateId(deleted_by);

    //**************** check if deleter user is exist and has admin role
    const userIsAdmin = await UserIsAdmin(deleted_by);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if student to be deleted is exist
    const studentIsExist = await StudentIsExist(_id);
    if (!studentIsExist) {
      throw new ApolloError('Student does not exist');
    }

    //**************** remove student_id from student array in school document
    await SchoolModel.updateOne({ students: _id }, { $pull: { students: _id } });

    //**************** compose object with validated input for Student
    const toBeDeletedSchool = {
      status: 'deleted',
      deleted_at: new Date(),
      deleted_by: deleted_by,
    };
    //**************** soft delete student by updating it with composed object
    await StudentModel.updateOne({ _id: _id }, toBeDeletedSchool);
    return 'Student deleted successfully';
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'DeleteStudent',
      path: '/graphql/student/student.resolver.js',
      parameter_input: JSON.stringify({ _id, deleted_by }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** LOADERS ***************

/**
 * Resolve the school_id field in a Student by using DataLoader.
 * @param {object} parent - Parent, student object.
 * @param {object} context - Resolver context.
 * @returns {Promise<Object|null>} - The school document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function school_id(parent, _, context) {
  try {
    //*************** check if student has any school_id
    if (!parent?.school_id) {
      return null;
    }

    //*************** load school
    const loadedSchool = await context.loaders.school.load(parent.school_id);
    return loadedSchool;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'School_Id',
      path: '/graphql/student/student.resolver.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Resolve the created_by field in a Student by using DataLoader.
 * @param {object} parent  - Parent, student object
 * @param {object} context - Resolver context
 * @returns {Promise<Object|null>} - The user document or null
 * @throws {Error} - Throws error if loading fails
 */
async function created_by(parent, _, context) {
  try {
    //*************** check if student has any created_by
    if (!parent?.created_by) {
      return null;
    }

    //*************** load user
    const loadedUser = await context.loaders.user.load(parent.created_by);
    return loadedUser;
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'Created_By',
      path: '/graphql/student/student.resolver.js',
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
    created_by: created_by,
    school_id: school_id,
    //*************** for displayed date format
    date_of_birth: (parent) => FormatDateToDisplayString(parent.date_of_birth),
  },
};
