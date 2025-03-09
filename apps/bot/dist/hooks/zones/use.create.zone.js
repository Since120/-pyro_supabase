"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZoneCreatedObservable = getZoneCreatedObservable;
// apps/bot/src/hooks/zones/use.create.zone.ts
const redis_pubsub_1 = require("../../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
// Neuer Ansatz: Verwendung von Redis statt Apollo Client
function getZoneCreatedObservable() {
    return redis_pubsub_1.redisPubSub.subscribe('zoneEvent', (message) => {
        // Nur bei Create-Events weiterverarbeiten
        if (message.eventType !== 'created') {
            return;
        }
        pyro_logger_1.default.info('Received zoneEvent (created):', message);
        // Hier die Logik für die Verarbeitung des Zone-Created-Events
        const { id, name, categoryId, discordVoiceId } = message;
        // Die Verarbeitung erfolgt jetzt direkt im Event-Handler, diese Hook-Funktion
        // ist nur noch für Kompatibilität oder benutzerdefinierte Logik vorhanden
    });
}
