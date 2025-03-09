"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesListener = void 0;
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
class RolesListener {
    constructor(client) {
        this.client = client;
        this.initialize();
        pyro_logger_1.default.info('Roles Listener initialisiert');
    }
    initialize() {
        // Auf den standardisierten Event-Typ 'roleEvent' hören
        redis_pubsub_1.redisPubSub.subscribe('roleEvent', async (payload) => {
            try {
                const roleEventPayload = payload;
                // Nur Anfragen (Requests) verarbeiten
                if (roleEventPayload.eventType !== 'request') {
                    return;
                }
                const { requestId, guildId } = roleEventPayload;
                const guild = await this.client.guilds.fetch(guildId);
                const roles = guild.roles.cache.map(role => ({
                    __typename: 'DiscordRole',
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    isHoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions.bitfield.toString(),
                    isManaged: role.managed,
                    isMentionable: role.mentionable,
                    createdAt: role.createdAt.toISOString(),
                    createdTimestamp: role.createdTimestamp,
                    tags: role.tags ? {
                        __typename: 'DiscordRoleTags',
                        botId: role.tags.botId,
                        integrationId: role.tags.integrationId,
                        isPremiumSubscriberRole: role.tags.premiumSubscriberRole
                    } : null
                }));
                // Standardisiertes Event-Format für die Antwort verwenden
                const roleEvent = {
                    eventType: 'response',
                    guildId,
                    requestId,
                    timestamp: new Date().toISOString(),
                    roles
                };
                // Event über den standardisierten Kanal veröffentlichen
                await redis_pubsub_1.redisPubSub.publish('roleEvent', roleEvent);
            }
            catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Unbekannter Fehler';
                // Fehlerantwort als RoleEvent formatieren und senden
                try {
                    const roleEventPayload = payload;
                    const requestId = roleEventPayload.requestId;
                    const guildId = roleEventPayload.guildId;
                    const errorEvent = {
                        eventType: 'error',
                        guildId,
                        requestId,
                        timestamp: new Date().toISOString(),
                        error: errorMessage
                    };
                    // Fehler über den standardisierten Kanal veröffentlichen
                    await redis_pubsub_1.redisPubSub.publish('roleEvent', errorEvent);
                }
                catch (e) {
                    pyro_logger_1.default.error('Fehler beim Extrahieren der Anfragedaten aus dem Payload:', e);
                }
                pyro_logger_1.default.error('Fehler beim Abrufen der Rollen:', error);
            }
        });
        // Für Rückwärtskompatibilität auch auf 'rolesRequest' hören, aber warnen
        redis_pubsub_1.redisPubSub.subscribe('rolesRequest', async (payload) => {
            pyro_logger_1.default.warn('Veralteter Event-Typ "rolesRequest" empfangen - bitte auf "roleEvent" mit eventType="request" umstellen');
            try {
                const { requestId, guildId } = payload;
                // Umwandlung in standardisiertes Format und Weiterleitung
                const roleEvent = {
                    eventType: 'request',
                    guildId,
                    requestId,
                    timestamp: new Date().toISOString()
                };
                // Weiterleitung an den Standardhandler
                redis_pubsub_1.redisPubSub.publish('roleEvent', roleEvent);
            }
            catch (error) {
                pyro_logger_1.default.error('Fehler bei der Verarbeitung des veralteten rolesRequest:', error);
            }
        });
    }
}
exports.RolesListener = RolesListener;
