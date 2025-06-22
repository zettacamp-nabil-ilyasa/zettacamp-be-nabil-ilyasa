// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model.js');

//*************** IMPORT VALIDATORS ***********************
const { ValidateSchoolCreateInput, ValidateSchoolUpdateInput } = require('./school.validators.js');

// *************** IMPORT UTILS ***************
const { SchoolIsExist, LogErrorToDb } = require('../../utils/common.js');
const { SanitizeAndValidateId, UserIsAdmin } = require('../../utils/common-validator.js');

// *************** IMPORT HELPER ***************
const { SchoolLongNameIsExist, SchoolBrandNameIsExist, SchoolIsReferencedByStudent } = require('./school.helpers.js');

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
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: {} });

    throw new ApolloError(error.message);
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
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { _id } });
    throw new ApolloError(error.message);
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
    //*************** validation to ensure input is sanitized and formatted correctly
    const validatedSchoolInput = ValidateSchoolCreateInput(input);
    const { long_name, brand_name, address, country, city, zipcode } = validatedSchoolInput;

    //*************** check if school name already exist
    const longNameIsExist = await SchoolLongNameIsExist(long_name);
    if (longNameIsExist) {
      throw new ApolloError("School's official name already exist");
    }
    const brandNameIsExist = await SchoolBrandNameIsExist(brand_name);
    if (brandNameIsExist) {
      throw new ApolloError("School's brand name already exist");
    }

    //*************** compose new object with validated input for School
    const validatedSchool = {
      long_name,
      brand_name,
      address,
      country,
      city,
      zipcode,
      status: 'active',
    };

    //*************** create school with validated input
    const createdSchool = await SchoolModel.create(validatedSchool);
    return createdSchool;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, input: input });

    throw new ApolloError(error.message);
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
    const validatedInput = ValidateSchoolUpdateInput(input);
    const { _id, long_name, brand_name, address, country, city, zipcode } = validatedInput;

    //*************** check if school exists
    const schoolIsExist = await SchoolIsExist(_id);
    if (!schoolIsExist) {
      throw new ApolloError('School does not exist');
    }

    //*************** check if school name already exist
    if (long_name) {
      const longNameIsExist = await SchoolLongNameIsExist(long_name, _id);
      if (longNameIsExist) {
        throw new ApolloError('School official name already exists');
      }
    }
    if (brand_name) {
      const brandNameIsExist = await SchoolBrandNameIsExist(brand_name, _id);
      if (brandNameIsExist) {
        throw new ApolloError('School brand name already exists');
      }
    }

    const validatedSchool = {};
    if (long_name) {
      validatedSchool.long_name = long_name;
    }
    if (brand_name) {
      validatedSchool.brand_name = brand_name;
    }
    if (address !== null && address !== undefined) {
      validatedSchool.address = address;
    }
    if (country !== null && country !== undefined) {
      validatedSchool.country = country;
    }
    if (city !== null && city !== undefined) {
      validatedSchool.city = city;
    }
    if (zipcode !== null && zipcode !== undefined) {
      validatedSchool.zipcode = zipcode;
    }

    //*************** update school with validated input
    const updatedSchool = await SchoolModel.findOneAndUpdate({ _id: _id }, validatedSchool, { new: true }).lean();
    return updatedSchool;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: input });

    throw new ApolloError(error.message);
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

    //**************** check if deleter user is exist and has admin role
    const userIsAdmin = await UserIsAdmin(validDeletedBy);
    if (!userIsAdmin) {
      throw new ApolloError('Unauthorized access');
    }

    //**************** check if school to be deleted is exist
    const schoolIsExist = await SchoolIsExist(validDeletedId);
    if (!schoolIsExist) {
      throw new ApolloError('School does not exist');
    }

    //**************** check if school is referenced by any student
    const schoolIsReferenced = await SchoolIsReferencedByStudent(validDeletedId);
    if (schoolIsReferenced) {
      throw new ApolloError('School that is referenced by a student cannot be deleted');
    }

    const toBeDeletedSchool = {
      deleted_at: new Date(),
      status: 'deleted',
      deleted_by: validDeletedBy,
    };

    //**************** soft-delete school by marking their status as 'deleted' and set deleted_date
    await SchoolModel.updateOne({ _id: validDeletedId }, toBeDeletedSchool);
    return 'School deleted successfully';
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: { _id, deletedBy } });

    throw new ApolloError(error.message);
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
  try {
    //*************** check if school has any student
    if (!parent?.students) {
      return [];
    }

    //*************** load students
    const loadedStudents = await context.loaders.student.loadMany(parent.students);
    return loadedStudents;
  } catch (error) {
    //*************** save error log to db
    await LogErrorToDb({ error, parameterInput: {} });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULES ***************
module.exports = {
  Query: { GetAllSchools, GetOneSchool },
  Mutation: { CreateSchool, UpdateSchool, DeleteSchool },
  School: {
    students: SchoolLoaderForStudents,
  },
};
