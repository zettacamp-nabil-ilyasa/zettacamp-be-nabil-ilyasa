// *************** IMPORT MODULE ***************
const Student = require('./student.model.js');
const User = require('../user/user.model.js');

// *************** IMPORT UTILS ***************
const { CleanNonRequiredInput } = require('../../utils/common.js');
const { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin } = require('../../utils/validator.js');

// *************** IMPORT HELPER ***************
const {
  ValidateStudentUpdateInput,
  ValidateStudentCreateInput,
  ValidateStudentAndUserCreateInput,
  StudentIsExist,
  SchoolIsExist,
  StudentEmailIsExist,
  UserEmailIsExist,
} = require('../helper/helper.js');

//***************QUERY***************

/**
 * Get all active students from the database.
 * @returns {Promise<Array<Object>>} - Array of student documents.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllStudents() {
  try {
    const students = await Student.find({ status: 'active' }).lean();
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
    const validId = SanitizeAndValidateId(_id);
    const student = await Student.findOne({ _id: validId, status: 'active' }).lean();
    return student;
  } catch (error) {
    throw new Error(error.message);
  }
}

//***************MUTATION***************

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

    //*************** validate input
    const validatedStudentInput = ValidateStudentCreateInput(cleanedInput);
    const { email, school_id } = validatedStudentInput;

    //*************** check if email already exist
    const emailIsExist = await StudentEmailIsExist(email);
    if (emailIsExist) {
      throw new Error('Email already exist');
    }

    //*************** check if school exist
    const schoolIsExist = await SchoolIsExist(school_id);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }

    validatedStudentInput.status = 'active';
    const createdStudent = await Student.create(validatedStudentInput);
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

    //*************** validate input
    const validatedUserInput = ValidateStudentAndUserCreateInput(cleanedInput);

    const { email, password, first_name, last_name, date_of_birth, school_id } = validatedUserInput;

    //*************** check if email already exist
    const userEmailExist = await UserEmailIsExist(email);
    const studentEmailExist = await StudentEmailIsExist(email);
    if (userEmailExist || studentEmailExist) {
      throw new Error('Email already exist');
    }
    //*************** check if school exist
    const schoolIsExist = await SchoolIsExist(school_id);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }
    //*************** create user
    const createdUser = await User.create({ email, password, first_name, last_name, status: 'active', roles: ['user'] });
    try {
      //*************** create student
      const createdStudent = await Student.create({
        email,
        first_name,
        last_name,
        date_of_birth,
        school_id,
        status: 'active',
        user_id: createdUser._id,
      });
      return createdStudent;
    } catch (error) {
      //*************** manual rollback
      await User.findOneAndDelete({ email });
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

    //**************** validate input
    const validatedStudentInput = ValidateStudentUpdateInput(cleanedInput);
    const { _id, email, school_id } = validatedStudentInput;

    //**************** check if student exist
    const studentIsExist = await StudentIsExist(_id);
    if (!studentIsExist) {
      throw new Error('Student does not exist');
    }

    //**************** check if email already exist
    if (email) {
      const emailIsExist = await StudentEmailIsExist(email, _id);
      if (emailIsExist) {
        throw new Error('Email already exist');
      }
    }

    //**************** check if school exist
    if (school_id) {
      const schoolIsExist = await SchoolIsExist(school_id);
      if (!schoolIsExist) {
        throw new Error('School does not exist');
      }
    }

    const updatedStudent = await Student.findOneAndUpdate({ _id: _id }, validatedStudentInput, { new: true });
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

    //**************** check if user's exist and has admin role
    const userIsAdmin = await UserIsAdmin(validDeletedBy);
    if (!userIsAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if student exist
    const studentIsExist = await StudentIsExist(validDeletedId);
    if (!studentIsExist) {
      throw new Error('Student does not exist');
    }
    await Student.findOneAndUpdate({ _id: validDeletedId }, { deleted_at: new Date(), status: 'deleted', deleted_by: validDeletedBy });
    return 'Student deleted successfully';
  } catch (error) {
    throw new Error(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllStudents, GetOneStudent },
  Mutation: { CreateStudent, CreateStudentWithUser, UpdateStudent, DeleteStudent },
};
