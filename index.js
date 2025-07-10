// *************** IMPORT CORE ***************
const ConnectDb = require('./core/database');
const InitializeApolloServer = require('./core/apollo');
const InitializeExpressApp = require('./core/express');

// *************** IMPORT LIBRARY ***************
const { PORT } = require('./core/config');

/**
 * Initializes and starts the Express server along with Apollo Server.
 * @async
 * @function InitializeServer
 * @returns {Promise<void>} - Resolves when the server is successfully running.
 * @throws {Error} - Throws error if any step during initialization fails.
 */
async function InitializeServer() {
  try {
    // *************** initialize express app
    const app = InitializeExpressApp();

    // *************** initialize apollo server
    const server = InitializeApolloServer();

    // *************** establish MongoDB connection
    await ConnectDb();

    // *************** start apollo server and apply GraphQL middleware
    await server.start();
    server.applyMiddleware({ app });
    console.log(`Apollo Server ready at http://localhost:${PORT}${server.graphqlPath}`);

    // *************** start express server
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

InitializeServer();
