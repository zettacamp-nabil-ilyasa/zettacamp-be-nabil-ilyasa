// *************** IMPORT MODULE ***************
const School = require('./school.model.js');

// *************** IMPORT HELPER ***************
const {
  ValidateSchoolUpdateInput,
  ValidateSchoolCreateInput,
  SchoolIsExist,
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  UserIsAdmin,
} = require('../helper/helper.js');

// *************** IMPORT UTILS ***************
const { CleanInputForUpdate } = require('../../utils/common.js');
const { CleanInputForCreate, IdIsValid } = require('../../utils/validator.js');

//****************QUERY****************

/**
 * Get all active schools from the database.
 * @returns {Promise<Array<Object>>} - Array of schools documents.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllSchools() {
  try {
    const schools = await School.find({ status: 'active' }).lean();
    return schools;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Get one active school by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the school to retrieve.
 * @returns {Promise<Object|null>} - The school document or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetOneSchool(_, { _id }) {
  try {
    const trimmedId = _id.trim();
    const isValidId = IdIsValid(trimmedId);
    if (!isValidId) {
      throw new Error('Invalid ID');
    }
    const school = await School.findOne({ _id: trimmedId, status: 'active' }).lean();
    return school;
  } catch (error) {
    throw new Error(error.message);
  }
}

//****************MUTATION****************

/**
 * Create a new school after validating input and checking email.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - School input fields.
 * @returns {Promise<Object>} - Created school document.
 * @throws {Error} - Throws error if validation fails or email already exists.
 */
async function CreateSchool(_, { input }) {
  try {
    //*************** clean input from null, undefined and empty string
    const cleanedInput = CleanInputForCreate(input);

    //*************** validate input
    const validatedSchoolInput = ValidateSchoolCreateInput(cleanedInput);
    const { long_name, brand_name } = validatedSchoolInput;

    //*************** check if school name already exist
    const longNameIsExist = await SchoolLongNameIsExist(long_name);
    const brandNameIsExist = await SchoolBrandNameIsExist(brand_name);
    if (longNameIsExist) {
      throw new Error("School's official name already exist");
    }
    if (brandNameIsExist) {
      throw new Error("School's brand name already exist");
    }
    validatedSchoolInput.status = 'active';
    const createdSchool = await School.create(validatedSchoolInput);
    return createdSchool;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Update a school after cleaning input, validating input and checking existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - School update fields.
 * @returns {Promise<Object>} - Updated school document.
 * @throws {Error} - Throws error if validation fails or student/email conflict.
 */
async function UpdateSchool(_, { input }) {
  try {
    //*************** clean input from null, undefined and empty string
    const cleanedInput = CleanInputForUpdate(input);

    //*************** validate input
    const validatedSchoolInput = ValidateSchoolUpdateInput(cleanedInput);
    const { _id, long_name, brand_name } = validatedSchoolInput;

    //*************** check if school exist
    const schoolIsExist = await SchoolIsExist(_id);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }

    //*************** check if school name already exist
    const longNameIsExist = await SchoolLongNameIsExist(long_name, _id);
    const brandNameIsExist = await SchoolBrandNameIsExist(brand_name, _id);
    if (longNameIsExist) {
      throw new Error("School's official name already exist");
    }
    if (brandNameIsExist) {
      throw new Error("School's brand name already exist");
    }
    const updatedSchool = await School.findOneAndUpdate({ _id: _id }, validatedSchoolInput, { new: true });
    return updatedSchool;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Soft delete a school by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args._id - ID of the school to delete.
 * @param {string} args.deletedBy - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or student not found.
 */
async function DeleteSchool(_, { _id, deletedBy }) {
  try {
    //**************** trim id and deletedBy
    const trimmedDeletedId = _id.trim();
    const trimmedDeletedBy = deletedBy.trim();
    //**************** check if id inputed is valid
    const deletedIdIsValid = await IdIsValid(trimmedDeletedId);
    const deletedByIsValid = await IdIsValid(trimmedDeletedBy);
    if (!deletedIdIsValid || !deletedByIsValid) {
      throw new Error('Invalid ID');
    }
    //**************** check if user's exist and has admin role
    const userIsAdmin = await UserIsAdmin(trimmedDeletedBy);
    if (!userIsAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if school exist
    const schoolIsExist = await SchoolIsExist(trimmedDeletedId);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }
    await School.findOneAndUpdate({ _id: trimmedDeletedId }, { deleted_at: new Date(), status: 'deleted', deleted_by: trimmedDeletedBy });
    return 'School deleted successfully';
  } catch (error) {
    throw new Error(error.message);
  }
}

//***************FIELD RESOLVER***************

/**
 * Resolve the student field for a School by using DataLoader.
 * @param {object} parent - Parent, school object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function StudentsFieldResolver(parent, _, context) {
  try {
    const schoolId = parent._id?.toString();
    const students = await context.loaders.StudentBySchoolLoader.load(schoolId);
    return students;
  } catch (error) {
    throw new Error(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllSchools, GetOneSchool },
  Mutation: { CreateSchool, UpdateSchool, DeleteSchool },
  School: {
    students: StudentsFieldResolver,
  },
};
