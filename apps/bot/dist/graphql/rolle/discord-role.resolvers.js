"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordRoleResolvers = void 0;
exports.discordRoleResolvers = {
    Query: {
        discordRoles: async (_, __, context) => {
            if (!context.discordClient) {
                throw new Error('Discord client is not available in context');
            }
            const guildId = process.env.GUILD_ID;
            if (!guildId) {
                throw new Error('DISCORD_GUILD_ID is not defined in environment variables');
            }
            let guild = context.discordClient.guilds.cache.get(guildId);
            if (!guild) {
                guild = await context.discordClient.guilds.fetch(guildId);
            }
            if (!guild) {
                throw new Error(`Guild with ID ${guildId} not found`);
            }
            const roles = guild.roles.cache.map((role) => ({
                id: role.id,
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions.bitfield.toString(),
                managed: role.managed,
                mentionable: role.mentionable,
                icon: role.icon,
                unicodeEmoji: role.unicodeEmoji,
                createdTimestamp: role.createdTimestamp,
                createdAt: role.createdAt.toISOString(),
                tags: role.tags
                    ? {
                        botId: role.tags.botId || null,
                        premiumSubscriberRole: role.tags.premiumSubscriberRole || false,
                        integrationId: role.tags.integrationId || null,
                    }
                    : null,
            }));
            return roles;
        },
    },
};
