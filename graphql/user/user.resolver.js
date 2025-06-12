// *************** IMPORT MODULE ***************
const User = require('./user.model.js')

// *************** IMPORT UTILS ***************
const {EmailIsExist, CleanUpdateInput, CollectionIsExist} = require('../../utils/validator.js')

// *************** IMPORT HELPER ***************
const {ValidateUserCreateInput, ValidateUserUpdateInput, UserIsAdmin} = require('../helper/helper.js')


//***************QUERY***************

/**
 * Get all active users from the database.
 * @returns {Promise<Array<Object>>} - Array of user documents or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetAllUsers() { try{
    const users = await User.find({ status : 'active' })
    return users
}catch(error){
    throw new Error(error.message)
}

}

/**
 * Get one active user by ID.
 * @param {object} args - Resolver arguments.
 * @param {string} args.id - ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The user document or null.
 * @throws {Error} - Throws error if query fails.
 */
async function GetOneUser(_, {id}) {
    try{
        const users = await User.find({ status : 'active' })
        return users
    }catch(error){
       console.log(error.message)
       throw error
    }

}

//**************MUTATION***************

/**
 * Create a new user after validating input and checking email existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User input fields.
 * @returns {Promise<Object>} - Created user document.
 * @throws {Error} - Throws error if validation fails or email already exists.
 */
async function CreateUser(_, {input}) {
    try{
        //**************** validate input
        const validatedUserInput = ValidateUserCreateInput(input)
        const {email} = validatedUserInput

        //**************** check if email already exist
        const emailIsExist = await EmailIsExist(User, email)
        if (emailIsExist) {
            throw new Error('Email already exist')
        }
        validatedUserInput.status = 'active'
        const createdUser = await User.create(validatedUserInput)
        return createdUser
    }catch (error){
        console.log(error.message)
        throw error
    }
}

/**
 * Update a user after cleaning input, validating input, and checking existence.
 * @param {object} args - Resolver arguments.
 * @param {object} args.input - User update fields.
 * @returns {Promise<Object>} - Updated user document.
 * @throws {Error} - Throws error if validation fails or user/email conflict.
 */
async function UpdateUser(_, {input}) {
    try{
        //**************** clean input from null, undefined and empty string
        User.cleanedInput = CleanUpdateInput(input)

        //**************** validate input
        const validatedUserInput = ValidateUserUpdateInput(cleanedInput)
        const {id, email} = validatedUpdateInput

        //**************** check if user exist
        const userIsExist = await CollectionIsExist(User, id)
        if (!userIsExist) {
            throw new Error('User does not exist')
        }

        //**************** check if email already exist
        const emailIsExist = await EmailIsExist(User, email, id)
        if (emailIsExist) {
            throw new Error('Email already exist')
        }
        const updatedUser = await User.findOneAndUpdate({_id : id}, validatedUserInput, {new: true})
        return updatedUser
    }catch (error){
        console.log(error.message)
        throw error
}
}

/**
 * Soft delete a user by marking their status as 'deleted'.
 * @param {object} args - Resolver arguments.
 * @param {string} args.id - ID of the user to delete.
 * @param {string} args.deletedBy - ID of the admin performing the deletion.
 * @returns {Promise<string>} - Deletion success message.
 * @throws {Error} - Throws error if unauthorized or user not found.
 */
async function DeleteUser(_, {id, deletedBy}) {
    try{
        //**************** check if user's role is admin
        const userIsAdmin = await UserIsAdmin(User, deletedBy)
        if (!userIsAdmin) {
            throw new Error('Unauthorized access')
        }

        //**************** check if user exist
        const userIsExist = await CollectionIsExist(User, id)
        if (!userIsExist) {
            throw new Error('User does not exist')
        }

        await User.findOneAndUpdate({_id : id}, {deleted_at : new Date(), status: 'deleted', deleted_by: deletedBy})
        return 'User deleted successfully'
    }catch(error){
        console.log(error.message)
        throw error
    }

}

/**
 * Resolve the student field for a User by using DataLoader.
 * @param {object} parent - Parent, user object.
 * @param {object} context - Resolver context.
 * @param {object} context.loaders - DataLoader object.
 * @returns {Promise<Object|null>} - The student document or null.
 * @throws {Error} - Throws error if loading fails.
 */
async function StudentFieldResolver(parent, _, context){
    try{
        const userId = parent._id?.toString() || parent.id?.toString()
        const studentLoader = context.loaders.studentByUserLoader.load(userId)
        return studentLoader
    }catch(error){
        console.log(error.message)
        throw error
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {GetAllUsers, GetOneUser},
    Mutation: {CreateUser, UpdateUser, DeleteUser},
    User: {
        student: StudentFieldResolver
    }
}