// *************** IMPORT MODULE ***************
const School = require('./school.model.js')
const User = require('../user/user.model.js')
// const Student = require('../student/student.model.js')
const {NameIsExist} = require('../helper/helper.js')
const {CleanUpdateInput} = require('../../utils/validator.js')
const {ValidateSchoolUpdateInput, ValidateSchoolCreateInput, UserIsAdmin} = require('../helper/helper.js')

//****************QUERY**************** 
async function GetAllSchools() {
    return await School.find({status : 'active'})
}
async function GetOneSchool(_, {id}) {
    return await School.findOne({_id : id, status : 'active'})
}

//****************MUTATION**************** 
async function CreateSchool(_, {input}) {
    const validatedSchoolInput = ValidateSchoolCreateInput(input)
    const {long_name} = validatedSchoolInput
    const nameIsExist = await NameIsExist(School, long_name)
    if (nameIsExist) {
        throw new Error('School name already exist')
    }
    validatedSchoolInput.status = 'active'
    const createdSchool = await School.create(validatedSchoolInput)
    return createdSchool
}
async function UpdateSchool(_, {input}) {
    const {id} = input
    const updatedSchool = CleanUpdateInput(input)
    const validatedSchoolInput = ValidateSchoolUpdateInput(updatedSchool)
    return await School.findOneAndUpdate({_id : id}, validatedSchoolInput, {new: true})
}
async function DeleteSchool(_, {id, deletedBy}) {
    const userIsAdmin = await UserIsAdmin(User, deletedBy)
    if (!userIsAdmin) {
        throw new Error('Unauthorized access')
    }
    await School.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted', deleted_by: deletedBy})
    return 'School deleted successfully'
}

//***************FIELD RESOLVER***************
async function StudentsFieldResolver(parent, _, context) {
    const schoolId = parent._id?.toString()
    return context.loaders.studentBySchoolLoader.load(schoolId)
}

// *************** EXPORT MODULE *************** 
module.exports = {
    Query: {GetAllSchools, GetOneSchool},
    Mutation: {CreateSchool, UpdateSchool, DeleteSchool},
    School: {
        students: StudentsFieldResolver
    }
}
