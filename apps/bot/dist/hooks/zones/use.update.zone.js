"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZoneUpdatedObservable = getZoneUpdatedObservable;
exports.getZoneDeletedObservable = getZoneDeletedObservable;
// apps/bot/src/hooks/zones/use.update.zone.ts
const redis_pubsub_1 = require("../../pubsub/redis.pubsub");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
// Neuer Ansatz: Verwendung von Redis statt Apollo Client für Zone-Updates
function getZoneUpdatedObservable() {
    return redis_pubsub_1.redisPubSub.subscribe('zoneEvent', (message) => {
        // Nur bei Update-Events weiterverarbeiten
        if (message.eventType !== 'updated') {
            return;
        }
        pyro_logger_1.default.info('Received zoneEvent (updated):', message);
        // Hier die Logik für die Verarbeitung des Zone-Updated-Events
        const { id, name, categoryId, discordVoiceId } = message;
        // Die Verarbeitung erfolgt jetzt direkt im Event-Handler, diese Hook-Funktion
        // ist nur noch für Kompatibilität oder benutzerdefinierte Logik vorhanden
    });
}
// Neuer Ansatz: Verwendung von Redis statt Apollo Client für Zone-Löschungen
function getZoneDeletedObservable() {
    return redis_pubsub_1.redisPubSub.subscribe('zoneEvent', (message) => {
        // Nur bei Delete-Events weiterverarbeiten
        if (message.eventType !== 'deleted') {
            return;
        }
        pyro_logger_1.default.info('Received zoneEvent (deleted):', message);
        // Hier die Logik für die Verarbeitung des Zone-Deleted-Events
        const { id, discordVoiceId } = message;
        // Die Verarbeitung erfolgt jetzt direkt im Event-Handler, diese Hook-Funktion
        // ist nur noch für Kompatibilität oder benutzerdefinierte Logik vorhanden
    });
}
