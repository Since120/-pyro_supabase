"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = exports.typeDefs = void 0;
// apps/bot/src/graphql/index.ts
const merge_1 = require("@graphql-tools/merge");
const apollo_server_express_1 = require("apollo-server-express");
const index_js_1 = require("./rolle/index.js");
// Basis-Query definieren, falls noch nicht vorhanden
const baseTypeDefs = (0, apollo_server_express_1.gql) `
	type Query {
		_empty: String
	}
`;
exports.typeDefs = (0, merge_1.mergeTypeDefs)([baseTypeDefs, index_js_1.discordRoleTypeDefs]);
exports.resolvers = (0, merge_1.mergeResolvers)([index_js_1.discordRoleResolvers]);
