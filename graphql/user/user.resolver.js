const userResolvers = {
    Query: {
        Users: () => {
            return []
        },
        User: (_, {id}) => {
            return null
        }
    },
    Mutation: {
        CreateUser: (_, args) => {
            return args
        },
        UpdateUser: (_, args) => {
            return args
        },
        DeleteUser: (_, {id}) => {
            return {id}
        }
    }
}

// *************** EXPORT MODULE ***************
module.exports = userResolvers