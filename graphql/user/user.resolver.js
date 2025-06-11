// *************** IMPORT MODULE ***************
const User = require('./user.model.js')
const {EmailIsExist} = require('../../utils/validator.js')
const {CleanUpdateInput} = require('../../utils/validator.js')
const {ValidateUserCreateInput, ValidateUserUpdateInput, UserIsAdmin} = require('../helper/helper.js')

//***************QUERY***************
async function GetAllUsers() {
    return await User.find({ status : 'active' })
}

async function GetOneUser(_, {id}) {
    return await User.findOne({ _id : id, status : 'active' })
}

//**************MUTATION***************
async function CreateUser(_, {input}) {
    validatedUserInput = ValidateUserCreateInput(input)
    const {email} = validatedUserInput
    const emailIsExist = await EmailIsExist(User, email)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    validatedUserInput.status = 'active'
    const createdUser = await User.create(validatedUserInput)
    return createdUser
}

async function UpdateUser(_, {input}) {
    User.cleanedInput = CleanUpdateInput(input)
    validatedUserInput = ValidateUserUpdateInput(cleanedInput)
    const {id, email} = validatedUpdateInput
    const emailIsExist = await EmailIsExist(User, email, id)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    return await User.findOneAndUpdate({_id : id}, validatedUserInput, {new: true})
}

async function DeleteUser(_, {id, deletedBy}) {
    const userIsAdmin = await UserIsAdmin(User, deletedBy)
    if (!userIsAdmin) {
        throw new Error('Unauthorized access')
    }
    await User.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted', deleted_by: deletedBy})
    return 'User deleted successfully'
}

async function StudentFieldResolver(parent, _, context){
    const userId = parent._id?.toString() || parent.id?.toString()
    return context.loaders.studentByUserLoader.load(userId)
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {GetAllUsers, GetOneUser},
    Mutation: {CreateUser, UpdateUser, DeleteUser},
    User: {
        student: StudentFieldResolver
    }
}