"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZoneDeleted = handleZoneDeleted;
// apps/bot/src/events/handle-zone-deleted.ts
const discord_js_1 = require("discord.js");
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
function handleZoneDeleted(discordClient) {
    redis_pubsub_1.redisPubSub.subscribe('zoneEvent', async (message) => {
        // Nur Events vom Typ 'deleted' verarbeiten
        if (message.eventType !== 'deleted') {
            return;
        }
        pyro_logger_1.default.info('Received zoneEvent (deleted):', message);
        try {
            const { id, discordVoiceId } = message;
            if (!discordVoiceId) {
                pyro_logger_1.default.warn('Kein discordVoiceId in der gelöschten Zone vorhanden.');
                return;
            }
            const channel = await discordClient.channels.fetch(discordVoiceId);
            if (!channel) {
                pyro_logger_1.default.warn(`Channel mit ID ${discordVoiceId} nicht gefunden.`);
                return;
            }
            if (channel instanceof discord_js_1.VoiceChannel) {
                pyro_logger_1.default.info(`Voice-Channel gefunden: ${channel.name}`);
                await channel.delete();
                pyro_logger_1.default.info(`Discord-Voice-Channel gelöscht: ${channel.name}`);
                // Bestätigung an API senden
                await redis_pubsub_1.redisPubSub.publish('zoneDeleteConfirmed', {
                    apiZoneId: id,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            pyro_logger_1.default.error('Fehler beim Löschen des Voice Channels:', error);
            // Fehler an API melden
            await redis_pubsub_1.redisPubSub.publish('zoneDeleteError', {
                apiZoneId: message.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
}
