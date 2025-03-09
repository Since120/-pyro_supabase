"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZoneUpdated = handleZoneUpdated;
// apps/bot/src/events/handle-zone-updated.ts
const discord_js_1 = require("discord.js");
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const channelMapping_1 = require("../utils/channelMapping");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
function handleZoneUpdated(discordClient) {
    redis_pubsub_1.redisPubSub.subscribe('zoneEvent', async (payload) => {
        // Nur Events vom Typ 'updated' verarbeiten
        if (payload.eventType !== 'updated') {
            return;
        }
        pyro_logger_1.default.info('Received zoneEvent (updated):', payload);
        const { id, name, discordVoiceId } = payload;
        // Wenn keine Discord Voice ID vorhanden ist, können wir nichts aktualisieren
        if (!discordVoiceId) {
            pyro_logger_1.default.warn('Kein discordVoiceId in der aktualisierten Zone vorhanden.');
            return;
        }
        // Verwenden der vorhandenen Mappings, um die Kategorie zu identifizieren
        const discordCategoryId = await (0, channelMapping_1.getChannelMapping)(discordVoiceId);
        // Wenn wir eine discordCategoryId haben, bestätigen wir das Mapping
        if (discordCategoryId) {
            // Bestätige das Mapping in Redis
            pyro_logger_1.default.info(`Vorhandenes Mapping gefunden: ${discordVoiceId} -> ${discordCategoryId}`);
        }
        else {
            pyro_logger_1.default.warn(`Kein Mapping für Voice-Channel ${discordVoiceId} gefunden.`);
            // Hier könnte man optional einen Fallback-Mechanismus implementieren,
            // um die discordCategoryId zu ermitteln, z.B. durch API-Anfrage
            // Da wir aber ein Update verarbeiten, sollte das Mapping bereits existieren
        }
        // Nur wenn wir eine Name-Änderung haben, aktualisieren wir den Discord-Channel
        if (name) {
            try {
                const channel = await discordClient.channels.fetch(discordVoiceId);
                if (!channel) {
                    pyro_logger_1.default.warn(`Channel mit ID ${discordVoiceId} nicht gefunden.`);
                    return;
                }
                if (channel instanceof discord_js_1.VoiceChannel) {
                    pyro_logger_1.default.info(`Voice-Channel gefunden: ${channel.name}`);
                    // Umbenennen des Voice-Channel-Namens
                    if (name !== channel.name) {
                        await channel.setName(name);
                        pyro_logger_1.default.info(`Voice-Channel ${channel.name} wurde auf ${name} umbenannt.`);
                    }
                    // Überprüfen ob der Channel in der richtigen Kategorie ist
                    const expectedCategoryId = await (0, channelMapping_1.getChannelMapping)(discordVoiceId);
                    if (expectedCategoryId && channel.parentId !== expectedCategoryId) {
                        pyro_logger_1.default.info(`Channel ${channel.name} wurde manuell verschoben. Verschiebe zurück in die korrekte Kategorie.`);
                        try {
                            await channel.setParent(expectedCategoryId);
                            pyro_logger_1.default.info(`Channel ${channel.name} wurde wieder in die korrekte Kategorie verschoben.`);
                        }
                        catch (err) {
                            pyro_logger_1.default.error(`Fehler beim Zurückverschieben des Channels ${channel.name}:`, err);
                        }
                    }
                }
            }
            catch (err) {
                pyro_logger_1.default.error('Fehler beim Aktualisieren des Voice Channels:', err);
            }
        }
    });
}
