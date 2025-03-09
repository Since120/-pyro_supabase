"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordRoleTypeDefs = void 0;
const apollo_server_express_1 = require("apollo-server-express");
exports.discordRoleTypeDefs = (0, apollo_server_express_1.gql) `
	"Zusätzliche Tags, die bei speziellen Rollen gesetzt werden (z. B. Bot-Rollen)"
	type DiscordRoleTags {
		botId: ID
		premiumSubscriberRole: Boolean
		integrationId: ID
	}

	"Ein vollständiges Abbild eines Discord-Role-Objekts"
	type DiscordRole {
		id: ID!
		name: String!
		color: Int!
		hoist: Boolean!
		position: Int!
		permissions: String!
		managed: Boolean!
		mentionable: Boolean!
		icon: String
		unicodeEmoji: String
		createdTimestamp: Float!
		createdAt: String!
		tags: DiscordRoleTags
	}

	extend type Query {
		discordRoles: [DiscordRole!]!
	}
`;
