"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryUpdateObservable = getCategoryUpdateObservable;
exports.getCategoryDeleteObservable = getCategoryDeleteObservable;
//apps\bot\src\hooks\categories\use.update.category.ts
const redis_pubsub_1 = require("../../pubsub/redis.pubsub"); // Redis Pub/Sub Mechanismus importieren
const pyro_logger_1 = __importDefault(require("pyro-logger"));
// Empfange Nachrichten von Redis für CategoryUpdate
function getCategoryUpdateObservable() {
    return redis_pubsub_1.redisPubSub.subscribe('categoryEvent', (message) => {
        // Nur bei Update-Events weiterverarbeiten
        if (message.eventType !== 'updated') {
            return;
        }
        pyro_logger_1.default.info('Received categoryEvent (updated) from Redis:', message);
        const { id, name, guildId, discordCategoryId } = message;
        // Logik für das Verarbeiten des Updates
        if (name) {
            // Verarbeite das Update
            pyro_logger_1.default.info(`Category updated: ${name}`);
        }
        else {
            // Interpretiere das als Lösch-Ereignis
            pyro_logger_1.default.info('Category event ohne Name – interpretiere das als Löschen der Kategorie');
        }
    });
}
// Empfange Nachrichten von Redis für CategoryDelete
function getCategoryDeleteObservable() {
    return redis_pubsub_1.redisPubSub.subscribe('categoryEvent', (message) => {
        // Nur bei Delete-Events weiterverarbeiten
        if (message.eventType !== 'deleted') {
            return;
        }
        pyro_logger_1.default.info('Received categoryEvent (deleted) from Redis:', message);
        const { id, discordCategoryId, guildId } = message;
        // Logik für das Löschen der Kategorie
        pyro_logger_1.default.info(`Category deleted: ${discordCategoryId}`);
    });
}
