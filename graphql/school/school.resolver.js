// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');

// *************** IMPORT HELPER ***************
const {
  ValidateSchoolUpdateInput,
  ValidateSchoolCreateInput,
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  SchoolIsReferencedByStudent,
} = require('./school.helpers.js');

// *************** IMPORT UTILS ***************
const { CleanNonRequiredInput, SchoolIsExist } = require('../../utils/common.js');
const { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin } = require('../../utils/common-validator.js');

//**************** QUERY ****************

/**
 * Get all active schools from the database.
 * @returns {Promise<Array<Object>>} - Array of schools documents.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllSchools() {
  try {
    const schools = await SchoolModel.find({ status: 'active' }).lean();
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
    //**************** sanitize and validate id
    const validId = SanitizeAndValidateId(_id);

    const school = await SchoolModel.findOne({ _id: validId, status: 'active' }).lean();
    return school;
  } catch (error) {
    throw new Error(error.message);
  }
}

//**************** MUTATION ****************

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
    const cleanedInput = CleanRequiredInput(input);

    //*************** validation to ensure input is formatted correctly
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

    //*************** assign status
    validatedSchoolInput.status = 'active';

    //*************** create school with validated input
    const createdSchool = await SchoolModel.create(validatedSchoolInput);
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
 * @throws {Error} - Throws error if validation fails.
 */
async function UpdateSchool(_, { input }) {
  try {
    //*************** clean input from null, undefined and empty string
    const cleanedInput = CleanNonRequiredInput(input);

    //*************** validation to ensure input is formatted correctly
    const validatedSchoolInput = ValidateSchoolUpdateInput(cleanedInput);
    const { _id, long_name, brand_name } = validatedSchoolInput;

    //*************** check if school exists
    const schoolIsExist = await SchoolIsExist(_id);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }

    //*************** check if school name already exist
    if (long_name) {
      const longNameIsExist = await SchoolLongNameIsExist(long_name, _id);
      if (longNameIsExist) {
        throw new Error('School official name already exists');
      }
    }
    if (brand_name) {
      const brandNameIsExist = await SchoolBrandNameIsExist(brand_name, _id);
      if (brandNameIsExist) {
        throw new Error('School brand name already exists');
      }
    }

    //*************** update school with validated input
    const updatedSchool = await SchoolModel.findOneAndUpdate({ _id: _id }, validatedSchoolInput, { new: true }).lean();
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
 * @throws {Error} - Throws error if unauthorized or school not found.
 */
async function DeleteSchool(_, { _id, deletedBy }) {
  try {
    //**************** sanitize and validate id and deletedBy
    const validDeletedId = SanitizeAndValidateId(_id);
    const validDeletedBy = SanitizeAndValidateId(deletedBy);

    //**************** check if user to delete is exist and has admin role
    const userIsAdmin = await UserIsAdmin(validDeletedBy);
    if (!userIsAdmin) {
      throw new Error('Unauthorized access');
    }

    //**************** check if school to be deleted is exist
    const schoolIsExist = await SchoolIsExist(validDeletedId);
    if (!schoolIsExist) {
      throw new Error('School does not exist');
    }

    //**************** check if school is referenced by any student
    const schoolIsReferenced = await SchoolIsReferencedByStudent(validDeletedId);
    if (schoolIsReferenced) {
      throw new Error('School that is referenced by a student cannot be deleted');
    }

    //**************** soft-delete school by marking their status as 'deleted' and set deleted_date
    await SchoolModel.updateOne({ _id: validDeletedId }, { deleted_at: new Date(), status: 'deleted', deleted_by: validDeletedBy });
    return 'School deleted successfully';
  } catch (error) {
    throw new Error(error.message);
  }
}

//*************** LOADER ***************

/**
 * Resolve the students field for by using DataLoader.
 * @param {object} parent - Parent, school object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The students document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function SchoolLoaderForStudents(parent, _, context) {
  //*************** check if school has any student
  if (!parent?.students) {
    return [];
  }

  //*************** load students
  const loadedStudents = await context.loaders.student.loadMany(parent.students);
  return loadedStudents;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: { GetAllSchools, GetOneSchool },
  Mutation: { CreateSchool, UpdateSchool, DeleteSchool },
  School: {
    students: SchoolLoaderForStudents,
  },
};
