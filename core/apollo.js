// *************** IMPORT CORE ***************
const DataLoaders = require('./loaders.js');

// *************** IMPORT LIBRARY ***************
const { ApolloServer } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TypeDefs = require('./typedefs.js');
const Resolvers = require('./resolvers.js');
const { GetUserFromHeader } = require('../middleware/authorization.js');

/**
 * Initializes and returns a configured Apollo Server instance.
 * @returns {ApolloServer} Apollo Server with typeDefs, resolvers, and DataLoaders.
 */
function InitializeApolloServer() {
  return new ApolloServer({
    typeDefs: TypeDefs,
    resolvers: Resolvers,
    context: ({ req }) => {
      try {
        // *************** extract token from header
        const user = GetUserFromHeader(req?.headers);
        const contextObject = { user, loaders: DataLoaders() };
        return contextObject;
      } catch (error) {
        const contextObject = { user: null, loaders: DataLoaders };
        return contextObject;
      }
    },
  });
}

// *************** EXPORT MODULE ***************
module.exports = InitializeApolloServer;
