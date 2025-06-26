// *************** IMPORT LIBRARY ***************
const express = require('express');
const { ApolloServer } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const ConnectDb = require('./utils/mongoose');
const { TypeDefs, Resolvers } = require('./graphql/graphqlmerge');

// *************** IMPORT DATALOADERS ***************
const { UserLoader } = require('./graphql/user/user.loader');
const { SchoolLoader } = require('./graphql/school/school.loader');
const { StudentLoader } = require('./graphql/student/student.loader');

/**
 * Initializes and starts the Express and Apollo Server.
 * Sets up the GraphQL middleware and sets up DataLoaders to context.
 * Logs the server URL on successful startup.
 * Catches and logs any error during server setup.
 */
async function StartServer() {
  try {
    // *************** START: Set up Express ***************
    const app = express();
    app.use(express.json());
    // *************** END: Set up Express ***************

    // *************** START: Set up Apollo Server ***************
    const server = new ApolloServer({
      typeDefs: TypeDefs,
      resolvers: Resolvers,
      context: () => ({ loaders: { user: UserLoader(), school: SchoolLoader(), student: StudentLoader() } }),
    });
    // *************** END: Set up Apollo Server ***************

    // *************** apply GraphQL middleware
    await server.start();
    server.applyMiddleware({ app });

    const Port = process.env.PORT || 3000;
    app.listen({ port: Port }, () => {
      console.log(`Server ready at http://localhost:${Port}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// *************** connect to mongodb and start server
ConnectDb()
  .then(() => {
    console.log('Mongodb connected succesfully!');

    // *************** start server
    StartServer();
  })
  .catch((err) => console.error('Error connecting to mongodb', err));
