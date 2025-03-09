"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordRoleResolvers = exports.discordRoleTypeDefs = void 0;
// apps/bot/src/graphql/index.ts
var discord_role_schema_js_1 = require("./discord-role.schema.js");
Object.defineProperty(exports, "discordRoleTypeDefs", { enumerable: true, get: function () { return discord_role_schema_js_1.discordRoleTypeDefs; } });
var discord_role_resolvers_js_1 = require("./discord-role.resolvers.js");
Object.defineProperty(exports, "discordRoleResolvers", { enumerable: true, get: function () { return discord_role_resolvers_js_1.discordRoleResolvers; } });
