// *************** IMPORT MODULE ***************
const User = require('./user.model.js')
const {EmailIsExist} = require('../../utils/validator.js')
const {CleanUpdateInput} = require('../../utils/validator.js')


//***************QUERY***************
async function GetAllUsers() {
    return await User.find({ deleted_at : null })
}

async function GetOneUser(_, {id}) {
    return await User.findOne({ _id : id, deleted_at : null })
}

//**************MUTATION***************
async function CreateUser(_, {input}) {
    const {first_name, last_name, email, password, role} = input
    const emailIsExist = await EmailIsExist(User, email)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    const newUser = new User({first_name, last_name, email, password, status: 'active', role})
    await newUser.save()
    const createdUser = await User.findOne({email})
    return createdUser
}

async function UpdateUser(_, {input}) {
    const {id, first_name, last_name, email, password, role} = input
    const emailIsExist = await EmailIsExist(User, email, id)
    if (emailIsExist) {
        throw new Error('Email already exist')
    }
    const updatedUser = CleanUpdateInput(input)
    return await User.findOneAndUpdate({_id : id}, updatedUser, {new: true})
}

async function DeleteUser(_, {id}) {
    await User.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted'})
    return 'User deleted successfully'
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {GetAllUsers, GetOneUser},
    Mutation: {CreateUser, UpdateUser, DeleteUser}
}