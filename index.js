// *************** IMPORT LIBRARY *************** 
const express = require('express')
const { ApolloServer } = require('apollo-server-express')

// *************** IMPORT MODULE *************** 
const ConnectDb = require('./utils/mongoose')
const { TypeDefs, Resolvers } = require('./graphql/graphqlmerge')

// *************** IMPORT DATALOADER *************** 
const {StudentBySchoolLoader, StudentByUserLoader} = require('./utils/studentLoader')

/**
 * Initializes and starts the Express and Apollo Server.
 * Sets up the GraphQL middleware and sets up DataLoaders to context.
 * Logs the server URL on successful startup.
 * Catches and logs any error during server setup.
 */
async function StartServer() {
    try{
        //*************** set up express 
        const app = express()
        app.use(express.json());

        //*************** set up apollo server 
        const server = new ApolloServer({ typeDefs: TypeDefs, resolvers: Resolvers, context: () => ({loaders: {StudentBySchoolLoader: StudentBySchoolLoader(), StudentByUserLoader: StudentByUserLoader()}}) })

        //*************** start server
        await server.start()
        server.applyMiddleware({ app })

        app.listen({port: 3000}, () => {
            console.log(`Server ready at http://localhost:3000${server.graphqlPath}`)
        })
    }catch(error){
        console.log(error)
        throw error
    }
}

//*************** connect to mongodb and start server
ConnectDb()
.then(() => {
    console.log('Mongodb connected succesfully!')
    //*************** start server
    StartServer()
})
.catch(err => console.log('Error connecting to mongodb', err))