// *************** IMPORT MODULE ***************
const School = require('./school.model.js')
const Student = require('../student/student.model.js')
const {NameIsExist} = require('../helper/helper.js')

const schoolResolvers = {
    Query: {
        GetAllSchools: async () => {
            return await School.find({deleted_at : null})
        },
        GetOneSchool: async (_, {id}) => {
            return await School.findOne({_id : id, deleted_at : null})
        }
    },
    Mutation: {
        CreateSchool: async (_, args) => {
            const {name, address} = args
            const nameIsExist = await NameIsExist(School, name)
            if (nameIsExist) {
                throw new Error('School name already exist')
            }
            const newSchool = new School({name, address})
            await newSchool.save()
            const createdSchool = await School.findOne({name})
            return createdSchool
        },
        UpdateSchool: async (_, args) => {
            const {id, name, address} = args
            const nameIsExist = await NameIsExist(School, name, id)
            if (nameIsExist) {
                throw new Error('School name already exist')
            }
            return await School.findOneAndUpdate({_id : id}, {name, address}, {new: true})
        },
        DeleteSchool: async (_, {id}) => {
            return await School.findOneAndUpdate({_id : id}, {deleted_at : new Date()}, {new: true})
        }
    },
    School: {
        students: async (parent) => {
            return await Student.find({school_id : parent.id, deleted_at : null})
        }
    }
}

// *************** EXPORT MODULE *************** 
module.exports = schoolResolvers
