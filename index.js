// *************** IMPORT LIBRARY *************** 
const express = require('express')
const { ApolloServer } = require('apollo-server-express')


// *************** IMPORT MODULE *************** 
const ConnectDb = require('./utils/mongoose')
const { TypeDefs, Resolvers } = require('./graphql/graphqlmerge')



// ***************
async function StartServer() {
    const app = express()
    app.use(express.json());
    const server = new ApolloServer({ typeDefs: TypeDefs, resolvers: Resolvers })
    
    await server.start()
    server.applyMiddleware({ app })

    app.listen({port: 3000}, () => {
        console.log(`Server ready at http://localhost:3000${server.graphqlPath}`)
    })
}

// ***************
ConnectDb()
.then(() => {
    console.log('Mongodb connected succesfully!')
    StartServer()
})
.catch(err => console.log('Error connecting to mongodb', err))