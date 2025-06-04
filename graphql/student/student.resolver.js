const studentResolvers = {
    Query: {
        Students: () => {
            return []
        },
        Student: (_, {id}) => {
            return null
        }
    },
    Mutation: {
        CreateStudent: (_, args) => {
            return args
        },
        UpdateStudent: (_, args) => {
            return args
        },
        DeleteStudent: (_, {id}) => {
            return {id}
        }
    }
}