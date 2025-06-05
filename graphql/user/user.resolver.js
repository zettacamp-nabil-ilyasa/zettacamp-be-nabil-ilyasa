// *************** IMPORT MODULE ***************
const User = require('./user.model.js')
const {EmailIsExist} = require('../../utils/validator.js')

const userResolvers = {
    Query: {
        Users: async () => {
            return await User.find({ deleted_at : null })
        },
        User: async (_, {id}) => {
            return await User.findOne({ _id : id, deleted_at : null })
        }
    },
    Mutation: {
        CreateUser: async (_, args) => {
            const {first_name, last_name, email, password, role} = args
            const emailIsExist = await EmailIsExist(User, email)
            if (emailIsExist) {
                console.log('Email already exist')
                return null
            }
            const newUser = new User({first_name, last_name, email, password, role})
            await newUser.save()
            const createdUser = await User.findOne({email})
            return createdUser
        },

        UpdateUser: async (_, args) => {
            const {id, first_name, last_name, email, password, role} = args
            existingEmail = await EmailIsExist(User, email, id)
            if (existingEmail){
                throw new Error('Email already exist')
            }
            await User.findOneAndUpdate({_id : id}, {first_name, last_name, email, password, role}, {new: true})
           return await User.findOneAndUpdate({_id : id}, {first_name, last_name, email, password, role}, {new: true})

        },
        DeleteUser: async (_, {id}) => {
            const deletedUser = await User.findOneAndUpdate({_id : id}, {deleted_at : new Date()}, {new: true})
        },
    },
}

// *************** EXPORT MODULE ***************
module.exports = userResolvers