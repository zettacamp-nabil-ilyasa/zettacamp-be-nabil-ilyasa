// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge')
const { mergeResolvers } = require('@graphql-tools/merge')
const {gql} = require('apollo-server')
const {GraphQLScalarType, Kind} = require('graphql')

// *************** IMPORT MODULE ***************
const userTypeDefs = require('./user/user.schema.js')
const userResolvers = require('./user/user.resolver.js')
const schoolTypeDefs = require('./school/school.schema.js')
const schoolResolvers = require('./school/school.resolver.js')
const studentTypeDefs = require('./student/student.schema.js')
const studentResolvers = require('./student/student.resolver.js')

const baseTypeDefs = gql`
    scalar Date
    enum Status {
        active
        deleted
        suspended
    }

    type Query
    type Mutation
`

const baseResolvers = {
    Date: new GraphQLScalarType({
        name: "Date",
        description: "Date custom scalar type",
        parseValue(value) {
            return new Date(value)
        },
        serialize(value) {
            return value.toISOString()
        },
        parseLiteral(ast){
            if (ast.kind === Kind.STRING) {
                return new Date(ast.value)
            }
            return null
        },
    }),
}

const TypeDefs = mergeTypeDefs([baseTypeDefs,userTypeDefs, schoolTypeDefs, studentTypeDefs])
const Resolvers = mergeResolvers([baseResolvers, userResolvers, schoolResolvers, studentResolvers])

// *************** EXPORT MODULE ***************
module.exports = { TypeDefs, Resolvers }