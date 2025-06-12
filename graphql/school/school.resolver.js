// *************** IMPORT MODULE ***************
const School = require('./school.model.js')
const User = require('../user/user.model.js')

// *************** IMPORT HELPER ***************
const {ValidateSchoolUpdateInput, ValidateSchoolCreateInput, SchoolLongNameIsExist, SchoolBrandNameIsExist, UserIsAdmin} = require('../helper/helper.js')

// *************** IMPORT UTILS ***************
const {CleanUpdateInput, CollectionIsExist} = require('../../utils/validator.js')

//****************QUERY**************** 

/**
 * Get all active schools from the database.
 * @returns {Promise<Array<Object>>} - Array of schools documents.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllSchools() {
    try{
        const schools = await School.find({status : 'active'})
        return schools
    }catch(error){
        throw new Error(error)
    }
}

/**
 * Get one active school by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args.id - ID of the school to retrieve.
 * @returns {Promise<Object|null>} - The school document or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetOneSchool(_, {id}) {
    try{
        const school = await School.findOne({_id : id, status : 'active'})
        return school
    }catch(error){
        throw new Error(error)
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
async function CreateSchool(_, {input}) {
    try{
    //*************** validate input
    const validatedSchoolInput = ValidateSchoolCreateInput(input)
    const {long_name, brand_name} = validatedSchoolInput

    //*************** check if school name already exist
    const longNameIsExist = await SchoolLongNameIsExist(School, long_name)
    const brandNameIsExist = await SchoolBrandNameIsExist(School, brand_name)
    if (longNameIsExist) {
        throw new Error('School\'s official name already exist')
    }
    if (brandNameIsExist) {
        throw new Error('School\'s brand name already exist')
    }
    validatedSchoolInput.status = 'active'
    const createdSchool = await School.create(validatedSchoolInput)
    return createdSchool

    }catch(error){
        console.log(error)
        throw new Error(error)
    }
}

/**
 * Update a school after cleaning input, validating input and checking existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - School update fields.
 * @returns {Promise<Object>} - Updated school document.
 * @throws {Error} - Throws error if validation fails or student/email conflict.
 */
async function UpdateSchool(_, {input}) {
    try{
        //*************** clean input from null, undefined and empty string
        const cleanedInput = CleanUpdateInput(input)

        //*************** validate input
        const validatedSchoolInput = ValidateSchoolUpdateInput(cleanedInput)
        const {id, long_name, brand_name} = validatedSchoolInput

        //*************** check if school exist
        const schoolIsExist = await CollectionIsExist(School, id)
        if (!schoolIsExist) {
            throw new Error('School does not exist')
        }

        //*************** check if school name already exist
        const longNameIsExist = await SchoolLongNameIsExist(School, long_name, id)
        const brandNameIsExist = await SchoolBrandNameIsExist(School, brand_name, id)
        if (longNameIsExist) {
            throw new Error('School\'s official name already exist')
        }
        if (brandNameIsExist) {
            throw new Error('School\'s brand name already exist')
        }
        const updatedSchool = await School.findOneAndUpdate({_id : id}, validatedSchoolInput, {new: true})
        return updatedSchool
    }catch(error){
        console.log(error)
        throw new Error(error)
    }
}

/**
 * Soft delete a school by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args.id - ID of the school to delete.
 * @param {string} args.deletedBy - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or student not found.
 */
async function DeleteSchool(_, {id, deletedBy}) {
    try{
        //**************** check if user's role is admin
        const userIsAdmin = await UserIsAdmin(User, deletedBy)
        if (!userIsAdmin) {
            throw new Error('Unauthorized access')
        }

        //**************** check if school exist
        const schoolIsExist = await CollectionIsExist(School, id)
        if (!schoolIsExist) {
            throw new Error('School does not exist')
        }
        await School.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted', deleted_by: deletedBy})
        return 'School deleted successfully'
    }catch(error){
        console.log(error)
        throw new Error(error)
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
    try{
        const schoolId = parent._id?.toString()
        studentLoader = context.loaders.StudentBySchoolLoader.load(schoolId)
        return studentLoader
    }catch(error){
        console.log(error)
        throw new Error(error)
    }
}


// *************** EXPORT MODULE *************** 
module.exports = {
    Query: {GetAllSchools, GetOneSchool},
    Mutation: {CreateSchool, UpdateSchool, DeleteSchool},
    School: {
        students: StudentsFieldResolver
    }
}
