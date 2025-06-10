// *************** IMPORT MODULE ***************
const School = require('./school.model.js')
// const Student = require('../student/student.model.js')
const {NameIsExist} = require('../helper/helper.js')
const {CleanUpdateInput} = require('../../utils/validator.js')

//****************QUERY**************** 
async function GetAllSchools() {
    return await School.find({status : 'active'})
}
async function GetOneSchool(_, {id}) {
    return await School.findOne({_id : id, status : 'active'})
}

//****************MUTATION**************** 
async function CreateSchool(_, {input}) {
    const {brand_name, long_name, address} = input
    const nameIsExist = await NameIsExist(School, long_name)
    if (nameIsExist) {
        throw new Error('School name already exist')
    }
    const newSchool = new School({brand_name, long_name, address, status: 'active'})
    await newSchool.save()
    const createdSchool = await School.findOne({long_name})
    return createdSchool
}
async function UpdateSchool(_, {input}) {
    const {id} = input
    const updatedSchool = CleanUpdateInput(input)
    return await School.findOneAndUpdate({_id : id}, updatedSchool, {new: true})
}
async function DeleteSchool(_, {id}) {
    await School.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted'})
    return 'School deleted successfully'
}

//***************FIELD RESOLVER***************
async function StudentsFieldResolver(parent, _, context) {
    const schoolId = parent._id?.toString()
    return context.loaders.studentLoader.load(schoolId)
}

// *************** EXPORT MODULE *************** 
module.exports = {
    Query: {GetAllSchools, GetOneSchool},
    Mutation: {CreateSchool, UpdateSchool, DeleteSchool},
    School: {
        students: StudentsFieldResolver
    }
}
