"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisPubSub = void 0;
// apps/bot/src/pubsub/redis.pubsub.ts
const ioredis_1 = require("ioredis");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
// Wir importieren die PubSubEvents-Definition aus der model.ts Datei,
// die vom copy-pubsub-types.js Script generiert wird
// Redis-Verbindung für den Publisher-Modus
const getRedisConfig = () => {
    const config = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times) => Math.min(times * 100, 5000),
        connectionName: process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
    };
    pyro_logger_1.default.info('[Redis] Aktive Konfiguration:', config);
    return config;
};
const redisPublisher = new ioredis_1.Redis(getRedisConfig());
const redisSubscriber = new ioredis_1.Redis(getRedisConfig());
// Logge den Verbindungsstatus für den Publisher
redisPublisher.on('connect', () => {
    pyro_logger_1.default.info('Redis Publisher verbunden');
});
redisPublisher.on('error', (err) => {
    pyro_logger_1.default.error('Fehler bei der Verbindung des Redis Publishers:', err);
});
// Logge den Verbindungsstatus für den Subscriber
redisSubscriber.on('connect', () => {
    pyro_logger_1.default.info('Redis Subscriber verbunden');
});
redisSubscriber.on('error', (err) => {
    pyro_logger_1.default.error('Fehler bei der Verbindung des Redis Subscribers:', err);
});
redisSubscriber.on('subscribe', (channel, count) => {
    pyro_logger_1.default.info(`✅ [REDIS] Erfolgreich abonniert: Kanal ${channel}, insgesamt ${count} Kanäle`);
});
redisSubscriber.on('message', (channel, message) => {
    pyro_logger_1.default.debug(`📨 [REDIS] Nachricht auf ${channel} empfangen: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
});
// Pub/Sub-Mechanismus
exports.redisPubSub = {
    // Veröffentliche ein Event
    publish: async (channel, message) => {
        try {
            // Explizite Umwandlung, da Redis nur Strings akzeptiert
            const channelStr = String(channel);
            await redisPublisher.publish(channelStr, JSON.stringify(message));
            pyro_logger_1.default.info(`Event an Redis auf Kanal ${channelStr} gesendet:`, message);
        }
        catch (err) {
            pyro_logger_1.default.error('Fehler beim Senden an Redis:', err);
        }
    },
    // Subscribe mit Typsicherheit
    subscribe: (channel, callback) => {
        const channelStr = String(channel);
        pyro_logger_1.default.info(`🔔 Abonniere Redis-Kanal: ${channelStr}`);
        try {
            // Schritt 1: Kanal abonnieren
            redisSubscriber.subscribe(channelStr, (err) => {
                if (err) {
                    pyro_logger_1.default.error(`❌ Abonnement für ${channelStr} fehlgeschlagen:`, err);
                    return;
                }
                pyro_logger_1.default.info(`✅ Erfolgreich auf ${channelStr} abonniert`);
            });
            // Schritt 2: Nachrichten verarbeiten
            redisSubscriber.on('message', (chan, message) => {
                if (chan === channelStr) {
                    pyro_logger_1.default.debug(`📨 [REDIS] Nachricht auf ${chan} empfangen`);
                    try {
                        const parsed = JSON.parse(message);
                        pyro_logger_1.default.debug('📄 Parsed content:', parsed);
                        callback(parsed);
                    }
                    catch (err) {
                        pyro_logger_1.default.error('❌ FEHLER beim Parsen:', {
                            error: err?.message || 'Unknown error',
                            rawData: message
                        });
                    }
                }
            });
        }
        catch (error) {
            pyro_logger_1.default.error(`❌ Allgemeiner Fehler beim Abonnieren von ${channelStr}:`, error);
        }
        return {
            unsubscribe: () => {
                // Explizite Umwandlung für Redis-Methoden
                redisSubscriber.unsubscribe(String(channel));
                pyro_logger_1.default.info(`🛑 Abonnement von ${String(channel)} beendet`);
            }
        };
    },
    redisPublisher,
    redisSubscriber,
};
