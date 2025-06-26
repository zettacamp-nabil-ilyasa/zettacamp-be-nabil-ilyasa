// *************** IMPORT LIBRARY ***************
const { ApolloServer } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const TypeDefs = require('./typedefs.js');
const Resolvers = require('./resolvers.js');

// *************** IMPORT DATALOADERS ***************
const DataLoaders = require('./loaders.js');

/**
 * Initializes and returns a configured Apollo Server instance.
 * @returns {ApolloServer} Apollo Server with typeDefs, resolvers, and DataLoaders.
 */
function InitializeApolloServer() {
  return new ApolloServer({
    typeDefs: TypeDefs,
    resolvers: Resolvers,
    context: () => ({ loaders: DataLoaders() }),
  });
}

// *************** EXPORT MODULE ***************
module.exports = InitializeApolloServer;
