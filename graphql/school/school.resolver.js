// *************** IMPORT MODULE ***************
const School = require('./school.model.js')
// const Student = require('../student/student.model.js')
const {NameIsExist} = require('../helper/helper.js')
const {CleanUpdateInput} = require('../../utils/validator.js')

const schoolResolvers = {
    School: {
         students: (parent, _, context) => {
            const schoolId = parent._id?.toString()|| parent.id?.toString()
            console.log("Resolving students for school:", schoolId)
            return context.loaders.studentLoader.load(schoolId)
        }
},
    Query: {
        GetAllSchools: async () => {
            return await School.find({status : 'active'})
        },
        GetOneSchool: async (_, {id}) => {
            return await School.findOne({_id : id, status : 'active'})
        }
    },
    Mutation: {
        CreateSchool: async (_, {input}) => {
            const {brand_name, long_name, address} = input
            const nameIsExist = await NameIsExist(School, long_name)
            if (nameIsExist) {
                throw new Error('School name already exist')
            }
            const newSchool = new School({brand_name, long_name, address, status: 'active'})
            await newSchool.save()
            const createdSchool = await School.findOne({long_name})
            return createdSchool
        },
        UpdateSchool: async (_, {input}) => {
            const {id, brand_name, long_name, address} = input
            const nameIsExist = await NameIsExist(School, long_name, id)
            if (nameIsExist) {
                throw new Error('School name already exist')
            }
            const updatedSchool = CleanUpdateInput(input)
            return await School.findOneAndUpdate({_id : id}, updatedSchool, {new: true})
        },
        DeleteSchool: async (_, {id}) => {
            await School.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted'})
            return 'School deleted successfully'
        }
    }
}

// *************** EXPORT MODULE *************** 
module.exports = schoolResolvers
