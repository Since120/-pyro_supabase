"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryCreatedObservable = getCategoryCreatedObservable;
//apps\bot\src\hooks\categories\use.create.category.ts
const redis_pubsub_1 = require("../../pubsub/redis.pubsub");
// Empfange Nachrichten von Redis
function getCategoryCreatedObservable() {
    return redis_pubsub_1.redisPubSub.subscribe('categoryEvent', (message) => {
        // Nur 'created' Events verarbeiten
        if (message.eventType !== 'created') {
            return;
        }
        console.info('Received categoryEvent (created):', message);
        if (message) {
            const { id, name, guildId, discordCategoryId } = message;
            // Weitere Details könnten im details-Feld als JSON enthalten sein
            let details = {};
            try {
                if (message.details) {
                    details = JSON.parse(message.details);
                }
            }
            catch (e) {
                console.error('Fehler beim Parsen der Details', e);
            }
            console.info('guildId received from Redis event:', guildId);
            // Hier kannst du dann weiter die Verarbeitung durchführen
        }
    });
}
