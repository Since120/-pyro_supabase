"use strict";
// apps/bot/src/events/handle-zone-created.ts - Angepasste Version
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZoneCreated = handleZoneCreated;
const discord_js_1 = require("discord.js");
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
const channelMapping_1 = require("../utils/channelMapping");
function handleZoneCreated(discordClient) {
    redis_pubsub_1.redisPubSub.subscribe('zoneEvent', (message) => {
        // Nur Events vom Typ 'created' verarbeiten
        if (message.eventType !== 'created') {
            return;
        }
        // Vollständiges Event-Logging für Debugging
        pyro_logger_1.default.info('Received zoneEvent (created):', message);
        // Variablen vorsichtig extrahieren
        const apiZoneId = message.id;
        const name = message.name;
        const categoryId = message.categoryId;
        // Prüfe, ob das Event-Objekt das Feld direkt enthält
        if (!categoryId) {
            pyro_logger_1.default.error('Keine Kategorie-ID in der Zone gefunden');
            // Fehler an API zurückmelden mit dem korrekten Typ
            redis_pubsub_1.redisPubSub.publish('zoneEvent', {
                id: apiZoneId,
                eventType: 'error',
                categoryId: '', // Leerer String als Fallback
                message: 'Keine Kategorie-ID in der Zone gefunden',
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Jetzt können wir sicher auf discordCategoryId zugreifen, da es im Typ definiert ist
        let discordCategoryId = message.discordCategoryId;
        if (!discordCategoryId) {
            pyro_logger_1.default.error('Keine Discord-Kategorie-ID im Event gefunden');
            // Fallback zur Umgebungsvariable
            const fallbackCategoryId = process.env.DEFAULT_DISCORD_CATEGORY_ID;
            if (!fallbackCategoryId) {
                pyro_logger_1.default.error('Auch keine Fallback-Discord-Kategorie-ID gefunden');
                // Fehler an API zurückmelden mit dem korrekten Typ
                redis_pubsub_1.redisPubSub.publish('zoneEvent', {
                    id: apiZoneId,
                    eventType: 'error',
                    categoryId: categoryId || '', // Verwende die vorhandene categoryId oder leeren String
                    message: 'Keine Discord-Kategorie-ID gefunden und kein Fallback konfiguriert',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            pyro_logger_1.default.warn(`Verwende Fallback-Discord-Kategorie-ID aus Umgebungsvariable: ${fallbackCategoryId}`);
            discordCategoryId = fallbackCategoryId;
        }
        // Guild-ID aus der Umgebungsvariable verwenden
        const guildId = process.env.GUILD_ID;
        if (!guildId) {
            pyro_logger_1.default.error('GuildId fehlt in der Umgebungsvariable GUILD_ID');
            // Fehler an API zurückmelden mit dem korrekten Typ
            redis_pubsub_1.redisPubSub.publish('zoneEvent', {
                id: apiZoneId,
                eventType: 'error',
                categoryId: categoryId || '', // Verwende die vorhandene categoryId oder leeren String
                message: 'GuildId nicht konfiguriert in der Umgebungsvariable GUILD_ID',
                timestamp: new Date().toISOString()
            });
            return;
        }
        pyro_logger_1.default.info(`Erstelle Discord-Channel für Zone "${name}" in Kategorie ${discordCategoryId} (Guild: ${guildId})`);
        // Discord-Guild anhand der übergebenen Guild-ID abrufen
        discordClient.guilds.fetch(guildId)
            .then(guild => {
            // Einen Voice-Channel mit dem Namen der Zone in der entsprechenden Discord-Kategorie erstellen
            guild.channels.create({
                name: name || 'Neue Zone',
                type: discord_js_1.ChannelType.GuildVoice,
                parent: discordCategoryId,
                reason: `API Zone erstellt: ${apiZoneId}`
            })
                .then(voiceChannel => {
                pyro_logger_1.default.info(`Discord Voice-Channel erstellt: ${voiceChannel.name} (${voiceChannel.id})`);
                // Speichern der Channel-Zuordnung für den Guardian-Service
                (0, channelMapping_1.setChannelMapping)(voiceChannel.id, discordCategoryId)
                    .then(() => {
                    pyro_logger_1.default.info(`Channel-Zuordnung gesetzt: ${voiceChannel.id} -> ${discordCategoryId}`);
                })
                    .catch(err => {
                    pyro_logger_1.default.error('Fehler beim Setzen der Channel-Zuordnung:', err);
                });
                // Zone in der API mit der Discord Voice-ID aktualisieren
                // und eine Bestätigung senden mit dem korrekten Typ
                redis_pubsub_1.redisPubSub.publish('zoneEvent', {
                    id: apiZoneId,
                    eventType: 'confirmation',
                    name: voiceChannel.name,
                    categoryId: categoryId,
                    discordVoiceId: voiceChannel.id,
                    discordCategoryId: discordCategoryId,
                    timestamp: new Date().toISOString()
                });
                pyro_logger_1.default.info('Zone in API erfolgreich mit Discord Voice-ID aktualisiert');
            })
                .catch(err => {
                pyro_logger_1.default.error('Fehler beim Erstellen des Discord Voice-Channels:', err);
                // Fehler an API zurückmelden mit dem korrekten Typ
                redis_pubsub_1.redisPubSub.publish('zoneEvent', {
                    id: apiZoneId,
                    eventType: 'error',
                    categoryId: categoryId,
                    name: name,
                    message: `Fehler beim Erstellen des Voice-Channels: ${err.message}`,
                    timestamp: new Date().toISOString()
                });
            });
        })
            .catch(err => {
            pyro_logger_1.default.error(`Fehler beim Abrufen der Guild mit ID ${guildId}:`, err);
            // Fehler an API zurückmelden mit dem korrekten Typ
            redis_pubsub_1.redisPubSub.publish('zoneEvent', {
                id: apiZoneId,
                eventType: 'error',
                categoryId: categoryId,
                name: name,
                message: `Fehler beim Abrufen der Discord-Guild: ${err.message}`,
                timestamp: new Date().toISOString()
            });
        });
    });
}
