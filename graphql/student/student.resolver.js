// *************** IMPORT MODULE ***************
const School = require('../school/school.model.js')
const Student = require('./student.model.js')
const User = require('../user/user.model.js')
const {EmailIsExist, CleanUpdateInput} = require('../../utils/validator.js')
const {ValidateStudentUpdateInput, ValidateStudentCreateInput, ValidateStudentAndUserCreateInput, SchoolIsExist, UserIsAdmin} = require('../helper/helper.js')

//***************QUERY*************** 
async function GetAllStudents() {
    return await Student.find({status : 'active'})
}
async function GetOneStudent(_, {id}) {
    return await Student.findOne({ _id : id, status : 'active' })
}

//***************MUTATION*************** 
async function CreateStudent(_, {input}) {
    const validatedStudentInput = ValidateStudentCreateInput(input)
    const {email} = validatedStudentInput
    const emailIsExist = await EmailIsExist(Student, email)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    validatedStudentInput.status = 'active'
    const createdStudent = await Student.create(validatedStudentInput)
    return createdStudent
}

async function CreateUserWithStudent (_, {input}){
    try {
        const validatedUserInput = ValidateStudentAndUserCreateInput(input)

        const {email, password, first_name, last_name, date_of_birth, school_id} = validatedUserInput
        const userEmailExist = await EmailIsExist(User, email)
        const studentEmailExist = await EmailIsExist(Student, email)
        if (userEmailExist || studentEmailExist) {
            throw new Error('Email already exist')
        }
        const schoolExist = await SchoolIsExist(School, school_id)
        if (!schoolExist) {
            throw new Error('School does not exist')
        }
        //create user
        const  createdUser= await User.create({email, password, first_name, last_name, status: 'active', role: 'user'})
        try{
            const createdStudent = await Student.create({email, first_name, last_name, date_of_birth, school_id, status: 'active', user_id: createdUser._id})
            return createdStudent
        }catch (error){
            //manual rollback
            await User.findOneAndDelete({email})
            throw new Error("Failed to create student")
        }
    } catch (error) {
        throw new Error(error.message)
    }

}

async function UpdateStudent(_, {input}) {
    const updatedStudent = CleanUpdateInput(input)
    const validatedStudentInput = ValidateStudentUpdateInput(updatedStudent)
    const {id, email} = validatedStudentInput
    const emailIsExist = await EmailIsExist(Student, email, id)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }

    return await Student.findOneAndUpdate({_id : id}, validatedStudentInput, {new: true})
}
async function DeleteStudent(_, {id, deletedBy}) {
    const userIsAdmin = await UserIsAdmin(User, deletedBy)
    if (!userIsAdmin) {
        throw new Error('Unauthorized access')
    }
    await Student.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted', deleted_by: deletedBy})
    return 'Student deleted successfully'
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {GetAllStudents, GetOneStudent},
    Mutation: {CreateStudent, CreateUserWithStudent, UpdateStudent, DeleteStudent}
}