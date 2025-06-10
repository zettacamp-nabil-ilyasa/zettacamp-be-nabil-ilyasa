// *************** IMPORT MODULE ***************
const Student = require('./student.model.js')
const {EmailIsExist, CleanUpdateInput} = require('../../utils/validator.js')

//***************QUERY*************** 
async function GetAllStudents() {
    return await Student.find({deleted_at: null})
}
async function GetOneStudent(_, {id}) {
    return await Student.findOne({ _id : id, deleted_at : null })
}

//***************MUTATION*************** 
async function CreateStudent(_, {input}) {
    const {first_name, last_name, email, date_of_birth, school_id} = input
    const emailIsExist = await EmailIsExist(Student, email)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    const newStudent = new Student({first_name, last_name, email, date_of_birth, school_id, status: 'active'})
    await newStudent.save()
    const createdStudent = await Student.findOne({email})
    return createdStudent
}
async function UpdateStudent(_, {input}) {
    const {id, email} = input
    const emailIsExist = await EmailIsExist(Student, email, id)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    const updatedStudent = CleanUpdateInput(input)
    return await Student.findOneAndUpdate({_id : id}, updatedStudent, {new: true})
}
async function DeleteStudent(_, {id}) {
    await Student.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted'})
    return 'Student deleted successfully'
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {GetAllStudents, GetOneStudent},
    Mutation: {CreateStudent, UpdateStudent, DeleteStudent}
}