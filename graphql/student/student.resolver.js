// *************** IMPORT MODULE ***************
const Student = require('./student.model.js')
const {EmailIsExist} = require('../../utils/validator.js')

const studentResolvers = {
    Query: {
        GetAllStudents: async () => {
            return await Student.find({deleted_at: null})
        },
        GetOneStudent: async (_, {id}) => {
            return await Student.findOne({ _id : id, deleted_at : null })
        }
    },
    Mutation: {
        CreateStudent: async (_, args) => {
            const {first_name, last_name, email, date_of_birth, school_id} = args
            const emailIsExist = await EmailIsExist(Student, email)
            if (emailIsExist) {
                throw new Error('Email already exist')
            }
            const newStudent = new Student({first_name, last_name, email, date_of_birth, school_id})
            await newStudent.save()
            const createdStudent = await Student.findOne({email})
            return createdStudent
        },
        UpdateStudent: async (_, args) => {
            const {id, first_name, last_name, email, date_of_birth, school_id} = args
            const emailIsExist = await EmailIsExist(Student, email, id)
            if (emailIsExist) {
                throw new Error('Email already exist')
            }
            return await Student.findOneAndUpdate({_id : id}, {first_name, last_name, email, date_of_birth, school_id}, {new: true})
        },
        DeleteStudent: async (_, {id}) => {
            return await Student.findOneAndUpdate({_id : id}, {deleted_at : new Date()}, {new: true})
        }
    }
}

// *************** EXPORT MODULE ***************
module.exports = studentResolvers