const schoolResolvers = {
    Query: {
        Schools: () => {
            return []
        },
        School: (_, {id}) => {
            return null
        }
    },
    Mutation: {
        CreateSchool: (_, args) => {
            return args
        },
        UpdateSchool: (_, args) => {
            return args
        },
        DeleteSchool: (_, {id}) => {
            return {id}
        }
    }
}

// *************** EXPORT MODULE *************** 
module.exports = schoolResolvers