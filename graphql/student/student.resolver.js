// *************** IMPORT MODULE ***************
const School = require('../school/school.model.js')
const Student = require('./student.model.js')
const User = require('../user/user.model.js')

// *************** IMPORT UTILS ***************
const {EmailIsExist, CleanUpdateInput, CollectionIsExist} = require('../../utils/validator.js')

// *************** IMPORT HELPER ***************
const {ValidateStudentUpdateInput, ValidateStudentCreateInput, ValidateStudentAndUserCreateInput, SchoolIsExist, UserIsAdmin} = require('../helper/helper.js')

//***************QUERY*************** 

/**
 * Get all active students from the database.
 * @returns {Promise<Array<Object>>} - Array of student documents.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllStudents() {
    try{
        const students = await Student.find({status : 'active'})  
        return students
    }catch(error){
        console.log(error)
        throw new Error(error)
    }
}

/**
 * Get one active student by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args.id - ID of the student to retrieve.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetOneStudent(_, {id}) {
    try{
       const student = await Student.findOne({ _id : id, status : 'active' })
       return student
    }catch(error){
        console.log(error)
        throw new Error(error)
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
async function CreateStudent(_, {input}) {
    try{
        //*************** validate input
        const validatedStudentInput = ValidateStudentCreateInput(input)
        const {email} = validatedStudentInput

        //*************** check if email already exist 
        const emailIsExist = await EmailIsExist(Student, email)
        if (emailIsExist) {
            throw new Error('Email already exist')
        }
        validatedStudentInput.status = 'active'
        const createdStudent = await Student.create(validatedStudentInput)
        return createdStudent
    }catch(error){
        console.log(error)
        throw new Error(error)
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
async function CreateUserWithStudent (_, {input}){
    try {
        //*************** validate input
        const validatedUserInput = ValidateStudentAndUserCreateInput(input)

        const {email, password, first_name, last_name, date_of_birth, school_id} = validatedUserInput

        //*************** check if email already exist
        const userEmailExist = await EmailIsExist(User, email)
        const studentEmailExist = await EmailIsExist(Student, email)
        if (userEmailExist || studentEmailExist) {
            throw new Error('Email already exist')
        }
        //*************** check if school exist
        const schoolExist = await SchoolIsExist(School, school_id)
        if (!schoolExist) {
            throw new Error('School does not exist')
        }
        //*************** create user
        const  createdUser= await User.create({email, password, first_name, last_name, status: 'active', role: 'user'})
        try{
            //*************** create student
            const createdStudent = await Student.create({email, first_name, last_name, date_of_birth, school_id, status: 'active', user_id: createdUser._id})
            return createdStudent
        }catch (error){
            //*************** manual rollback
            await User.findOneAndDelete({email})
            throw new Error("Failed to create student")
        }
    } catch (error) {
        console.log(error)
        throw new Error(error)
    }

}

/**
 * Update a student after cleaning input, validating input and checking existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - Student update fields.
 * @returns {Promise<Object>} - Updated student document.
 * @throws {Error} - Throws error if validation fails or student/email conflict.
 */
async function UpdateStudent(_, {input}) {
    try{
        //**************** clean input from null, undefined and empty string
        const cleanedInput = CleanUpdateInput(input)

        //**************** validate input
        const validatedStudentInput = ValidateStudentUpdateInput(cleanedInput)
        const {id, email} = validatedStudentInput

        //**************** check if student exist
        const userIsExist = await CollectionIsExist(User, id)
        if (!userIsExist) {
            throw new Error('Student does not exist')
        }

        //**************** check if email already exist
        const emailIsExist = await EmailIsExist(Student, email, id)
        if (emailIsExist) {
            throw new Error('Email already exist')
        }
        const updatedStudent = await Student.findOneAndUpdate({_id : id}, validatedStudentInput, {new: true})
        return updatedStudent
    }catch(error){
        console.log(error)
        throw new Error(error)
    }
}

/**
 * Soft delete a student by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args.id - ID of the student to delete.
 * @param {string} args.deletedBy - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or student not found.
 */
async function DeleteStudent(_, {id, deletedBy}) {
    try{
        //**************** check if user's role is admin
        const userIsAdmin = await UserIsAdmin(User, deletedBy)
        if (!userIsAdmin) {
            throw new Error('Unauthorized access')
        }

        //**************** check if student exist
        const userIsExist = await CollectionIsExist(User, id)
        if (!userIsExist) {
            throw new Error('Student does not exist')
        }

        await Student.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted', deleted_by: deletedBy})
        return 'Student deleted successfully'
    }catch(error){
        console.log(error)
        throw new Error(error)
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {GetAllStudents, GetOneStudent},
    Mutation: {CreateStudent, CreateUserWithStudent, UpdateStudent, DeleteStudent}
}