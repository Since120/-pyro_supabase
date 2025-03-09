"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCategoryDeleted = handleCategoryDeleted;
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
function handleCategoryDeleted(discordClient) {
    redis_pubsub_1.redisPubSub.subscribe('categoryEvent', async (message) => {
        // Nur Events vom Typ 'deleted' verarbeiten
        if (message.eventType !== 'deleted') {
            return;
        }
        pyro_logger_1.default.info('Received categoryEvent (deleted):', message);
        try {
            // 1. Validierung
            if (!message.discordCategoryId) {
                pyro_logger_1.default.warn('Löschung ignoriert: Keine discordCategoryId', message);
                return;
            }
            if (!message.guildId) {
                pyro_logger_1.default.error('Fehlende guildId:', message);
                return;
            }
            // 2. Kanal löschen
            const guild = await discordClient.guilds.fetch(message.guildId);
            const channel = await guild.channels.fetch(message.discordCategoryId);
            if (channel) {
                await channel.delete(`API Delete: ${message.id}`);
                // 3. Bestätigung senden
                await redis_pubsub_1.redisPubSub.publish('categoryDeleteConfirmed', {
                    apiCategoryId: message.id,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            pyro_logger_1.default.error('Löschung fehlgeschlagen:', error);
            await redis_pubsub_1.redisPubSub.publish('categoryDeleteError', {
                apiCategoryId: message.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
}
