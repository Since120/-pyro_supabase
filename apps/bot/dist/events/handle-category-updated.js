"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCategoryUpdated = handleCategoryUpdated;
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
function handleCategoryUpdated(discordClient) {
    // Bessere Logging beim Start
    pyro_logger_1.default.info('🔄 Initialisiere Category-Update Handler');
    const subscription = redis_pubsub_1.redisPubSub.subscribe('categoryEvent', async (payload) => {
        // Nur Events vom Typ 'updated' verarbeiten
        if (payload.eventType !== 'updated') {
            return;
        }
        pyro_logger_1.default.info('Received categoryEvent (updated):', payload);
        try {
            // 1. Validierung der kritischen Felder
            if (!payload.discordCategoryId || !payload.guildId || !payload.name) {
                pyro_logger_1.default.warn('⚠️ Unvollständiges Update-Event:', {
                    id: payload.id,
                    hasDiscordId: !!payload.discordCategoryId,
                    hasGuildId: !!payload.guildId,
                    hasName: !!payload.name
                });
                return;
            }
            // 2. Guild und Kategorie suchen
            const guild = await discordClient.guilds.fetch(payload.guildId);
            const category = await guild.channels.fetch(payload.discordCategoryId);
            if (!category) {
                pyro_logger_1.default.error('❌ Kategorie nicht gefunden:', payload.discordCategoryId);
                // Fehler als standardisiertes Event zurücksenden
                await redis_pubsub_1.redisPubSub.publish('categoryEvent', {
                    id: payload.id,
                    guildId: payload.guildId,
                    name: payload.name,
                    discordCategoryId: payload.discordCategoryId,
                    timestamp: new Date().toISOString(),
                    eventType: 'error',
                    error: 'Discord category not found'
                });
                return;
            }
            // 3. Überprüfen ob Änderung notwendig ist
            // Der isDeletedInDiscord Parameter wird aus den Details extrahiert, falls vorhanden
            let isDeletedInDiscord = false;
            try {
                if (payload.details) {
                    const details = JSON.parse(payload.details);
                    isDeletedInDiscord = details.isDeletedInDiscord === true;
                }
            }
            catch (e) {
                pyro_logger_1.default.error('Fehler beim Parsen der Details', e);
            }
            if (category.name === payload.name && !isDeletedInDiscord) {
                pyro_logger_1.default.info('✅ Keine Namensänderung erforderlich');
                // WICHTIG: Erfolgsbestätigung als standardisiertes Event zurücksenden
                await redis_pubsub_1.redisPubSub.publish('categoryEvent', {
                    id: payload.id,
                    guildId: payload.guildId,
                    name: payload.name,
                    discordCategoryId: payload.discordCategoryId,
                    timestamp: new Date().toISOString(),
                    eventType: 'updateConfirmed',
                    details: JSON.stringify({
                        noChangeNeeded: true
                    })
                });
                return;
            }
            // 4. Kategorie aktualisieren
            await category.edit({
                name: payload.name,
                reason: `Update für Kategorie ${payload.id}`
            });
            pyro_logger_1.default.info(`✅ Kategorie ${payload.discordCategoryId} aktualisiert: "${payload.name}"`);
            // 5. WICHTIG: Erfolgsbestätigung als standardisiertes Event zurücksenden
            await redis_pubsub_1.redisPubSub.publish('categoryEvent', {
                id: payload.id,
                guildId: payload.guildId,
                name: payload.name,
                discordCategoryId: payload.discordCategoryId,
                timestamp: new Date().toISOString(),
                eventType: 'updateConfirmed'
            });
            // 6. Bei Löschung in Discord
            if (isDeletedInDiscord) {
                await category.delete(`Löschung angefordert für Kategorie ${payload.id}`);
                pyro_logger_1.default.warn(`🗑️ Kategorie ${payload.discordCategoryId} gelöscht`);
            }
        }
        catch (error) {
            pyro_logger_1.default.error('❌ Update fehlgeschlagen:', error);
            // Fehler als standardisiertes Event zurücksenden
            await redis_pubsub_1.redisPubSub.publish('categoryEvent', {
                id: payload.id,
                guildId: payload.guildId || '',
                name: payload.name || '',
                discordCategoryId: payload.discordCategoryId,
                timestamp: new Date().toISOString(),
                eventType: 'error',
                error: error.message || 'Unknown error'
            });
        }
    });
}
