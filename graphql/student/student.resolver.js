// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model.js');
const UserModel = require('../user/user.model.js');
const SchoolModel = require('../school/school.model.js');

// *************** IMPORT UTILS ***************
const { CleanNonRequiredInput, UserEmailIsExist, SchoolIsExist, FormatDateToIsoString } = require('../../utils/common.js');
const { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin } = require('../../utils/common-validator.js');

// *************** IMPORT HELPER ***************
const {
  ValidateStudentUpdateInput,
  ValidateStudentCreateInput,
  ValidateStudentAndUserCreateInput,
  StudentIsExist,
  StudentEmailIsExist,
  GetReferencedUserId,
} = require('./student.helpers.js');

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
    throw new Error(error.message);
  }
}

/**
 * Get one active student by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the student to retrieve.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetOneStudent(_, { _id }) {
  try {
    //**************** sanitize and validate id
    const validId = SanitizeAndValidateId(_id);

    const student = await StudentModel.findOne({ _id: validId, status: 'active' }).lean();
    return student;
  } catch (error) {
    throw new Error(error.message);
  }
}

//*************** MUTATION ***************

/**
 * Create a new student after validating input and checking email.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Student input fields.
 * @returns {Promise<Object>} - Created student document.
 * @throws {Error} - Throws error if validation fails or email already exists.
 */
async function CreateStudent(_, { input }) {
  try {
    //*************** clean input from null, undefined and empty string
    const cleanedInput = CleanRequiredInput(input);

    //*************** validation to ensure input is formatted correctly
    const validatedStudentInput = ValidateStudentCreateInput(cleanedInput);
    const { email, school_id } = validatedStudentInput;

    //*************** check if email already exists
    const emailIsExist = await StudentEmailIsExist(email);
    if (emailIsExist) {
      throw new Error('Email already exist');
    }

    //*************** check if school to delete is exist
    const schoolIsExist = await SchoolIsExist(school_id);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }

    //*************** set student status to active
    validatedStudentInput.status = 'active';

    //*************** create student
    const createdStudent = await StudentModel.create(validatedStudentInput);

    //*************** push created student id to student array in school document
    await SchoolModel.updateOne({ _id: school_id }, { $push: { students: createdStudent._id } });

    return createdStudent;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Create both a new user and a new student linked together.
 * If student creation fails, user creation will be rolled back.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Combined input for user and student.
 * @returns {Promise<Object>} - Created student document.
 * @throws {Error} - Throws error if validation fails or rollback is needed.
 */
async function CreateStudentWithUser(_, { input }) {
  try {
    //*************** clean input from null, undefined and empty string
    const cleanedInput = CleanRequiredInput(input);

    //*************** validation to ensure input is formatted correctly
    const validatedUserInput = ValidateStudentAndUserCreateInput(cleanedInput);
    const { email, password, first_name, last_name, date_of_birth, school_id } = validatedUserInput;

    //*************** check if email already exists
    const userEmailExist = await UserEmailIsExist(email);
    const studentEmailExist = await StudentEmailIsExist(email);
    if (userEmailExist || studentEmailExist) {
      throw new Error('Email already exist');
    }

    //*************** check if school is exist
    const schoolIsExist = await SchoolIsExist(school_id);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }
    //*************** create user with validated input, set status to active and roles to student
    const createdUser = await UserModel.create({ email, password, first_name, last_name, status: 'active', roles: ['student'] });
    try {
      //*************** create student with validated input, set status to active
      const createdStudent = await StudentModel.create({
        email,
        first_name,
        last_name,
        date_of_birth,
        school_id,
        status: 'active',
        user_id: createdUser._id,
      });

      //*************** push created student id to student array in school document
      await SchoolModel.updateOne({ _id: school_id }, { $push: { students: createdStudent._id } });

      //*************** set student id to student_id field in User
      await UserModel.updateOne({ _id: createdUser._id }, { student_id: createdStudent._id });

      return createdStudent;
    } catch (error) {
      //*************** manual rollback if student creation fails
      await UserModel.findOneAndDelete({ email });
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Update a student after cleaning input, validating input and checking existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Student update fields.
 * @returns {Promise<Object>} - Updated student document.
 * @throws {Error} - Throws error if validation fails or student/email conflict.
 */
async function UpdateStudent(_, { input }) {
  try {
    //**************** clean input from null, undefined and empty string
    const cleanedInput = CleanNonRequiredInput(input);

    //**************** validation to ensure input is formatted correctly
    const validatedStudentInput = ValidateStudentUpdateInput(cleanedInput);
    const { _id, email, school_id } = validatedStudentInput;

    //**************** check if student is exist
    const studentIsExist = await StudentIsExist(_id);
    if (!studentIsExist) {
      throw new Error('Student does not exist');
    }

    //**************** check if email already exists
    if (email) {
      const emailIsExist = await StudentEmailIsExist(email, _id);
      if (emailIsExist) {
        throw new Error('Email already exist');
      }
    }

    //**************** check if school is exist
    if (school_id) {
      const schoolIsExist = await SchoolIsExist(school_id);
      if (!schoolIsExist) {
        throw new Error('School does not exist');
      }
    }

    //**************** update student with validated input
    const updatedStudent = await StudentModel.findOneAndUpdate({ _id: _id }, validatedStudentInput, { new: true }).lean();
    return updatedStudent;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Soft delete a student by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the student to delete.
 * @param {string} args.deletedBy - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or student not found.
 */
async function DeleteStudent(_, { _id, deletedBy }) {
  try {
    //**************** sanitize and validate id and deletedBy
    const validDeletedId = SanitizeAndValidateId(_id);
    const validDeletedBy = SanitizeAndValidateId(deletedBy);

    //**************** check if user to delete is exist and has admin role
    const userIsAdmin = await UserIsAdmin(validDeletedBy);
    if (!userIsAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if student to be deleted is exist
    const studentIsExist = await StudentIsExist(validDeletedId);
    if (!studentIsExist) {
      throw new Error('Student does not exist');
    }

    //**************** check if student is referenced by any user
    const referencedUserId = await GetReferencedUserId(validDeletedId);
    if (referencedUserId) {
      await UserModel.updateOne({ _id: referencedUserId }, { deleted_at: new Date(), status: 'deleted', deleted_by: validDeletedBy });
    }

    //**************** pull student_id from student array in school document
    await SchoolModel.updateOne({ students: validDeletedId }, { $pull: { students: validDeletedId } });

    //**************** set student id to student_id field in User as null
    await UserModel.updateOne({ student_id: validDeletedId }, { student_id: null });

    //**************** soft delete student by marking their status as 'deleted' and set the deleted_date
    await StudentModel.updateOne({ _id: validDeletedId }, { deleted_at: new Date(), status: 'deleted', deleted_by: validDeletedBy });
    return 'Student deleted successfully';
  } catch (error) {
    throw new Error(error.message);
  }
}

// *************** LOADERS ***************

/**
 * Resolve the user field in a Student by using DataLoader.
 * @param {object} parent - Parent, student object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The user document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function StudentLoaderForUser(parent, _, context) {
  if (!parent?.user_id) {
    return null;
  }
  const userLoader = await context.loaders.user.load(parent?.user_id.toString());
  return userLoader;
}

/**
 * Resolve the school field in a Student by using DataLoader.
 * @param {object} parent - Parent, student object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The school document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function StudentLoaderForSchool(parent, _, context) {
  //*************** check if student has any school
  if (!parent?.school_id) {
    return null;
  }

  //*************** load school
  const schoolLoader = await context.loaders.school.load(parent.school_id);
  return schoolLoader;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudents, GetOneStudent },
  Mutation: { CreateStudent, CreateStudentWithUser, UpdateStudent, DeleteStudent },
  Student: {
    user: StudentLoaderForUser,
    school: StudentLoaderForSchool,
    //*************** for displayed date format
    date_of_birth: (parent) => FormatDateToIsoString(parent.date_of_birth),
  },
};
