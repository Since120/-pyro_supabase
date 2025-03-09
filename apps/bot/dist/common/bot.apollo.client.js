"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/common/bot.apollo.client.ts
const index_1 = require("@apollo/client/core/index");
const index_2 = require("@apollo/client/link/subscriptions/index");
const graphql_ws_1 = require("graphql-ws");
const index_3 = require("@apollo/client/utilities/index");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const apiUrl = process.env.API_URL;
if (!apiUrl) {
    throw new Error('API_URL is not defined in the environment variables.');
}
// HTTP-Link für Queries und Mutationen
const httpLink = new index_1.HttpLink({
    uri: `${apiUrl}/graphql`,
    fetch: cross_fetch_1.default,
});
// WS-Link für Subscriptions
const wsLink = new index_2.GraphQLWsLink((0, graphql_ws_1.createClient)({
    url: apiUrl.replace(/^http/, 'ws') + '/graphql',
}));
// Split-Link: sendet Subscription-Operationen an den wsLink, alle anderen an den httpLink
const splitLink = (0, index_1.split)(({ query }) => {
    const definition = (0, index_3.getMainDefinition)(query);
    return (definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription');
}, wsLink, httpLink);
const botApolloClient = new index_1.ApolloClient({
    link: new index_1.HttpLink({
        uri: `${process.env.BOT_API_URL}/graphql`, // ✅ Eigener Bot-Endpoint
        headers: {
            Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` // ✅ Service-to-Service Auth
        },
        fetch: cross_fetch_1.default
    }),
    cache: new index_1.InMemoryCache(),
});
exports.default = botApolloClient;
