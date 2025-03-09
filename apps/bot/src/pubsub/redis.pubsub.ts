// apps/bot/src/pubsub/redis.pubsub.ts
import { Redis } from 'ioredis';
import logger from 'pyro-logger';
import { PubSubEvents, RedisEvents, PubSubSubscription } from './redis.pubsub.model';

// Wir importieren die PubSubEvents-Definition aus der model.ts Datei,
// die vom copy-pubsub-types.js Script generiert wird

// Redis-Verbindung für den Publisher-Modus
const getRedisConfig = () => {
  const config = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times: number) => Math.min(times * 100, 5000),
    connectionName: process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
  };

  logger.info('[Redis] Aktive Konfiguration:', config);
  return config;
};

const redisPublisher = new Redis(getRedisConfig());
const redisSubscriber = new Redis(getRedisConfig());

// Logge den Verbindungsstatus für den Publisher
redisPublisher.on('connect', () => {
  logger.info('Redis Publisher verbunden');
});

redisPublisher.on('error', (err) => {
  logger.error('Fehler bei der Verbindung des Redis Publishers:', err);
});

// Logge den Verbindungsstatus für den Subscriber
redisSubscriber.on('connect', () => {
  logger.info('Redis Subscriber verbunden');
});

redisSubscriber.on('error', (err) => {
  logger.error('Fehler bei der Verbindung des Redis Subscribers:', err);
});

redisSubscriber.on('subscribe', (channel, count) => {
  logger.info(`✅ [REDIS] Erfolgreich abonniert: Kanal ${channel}, insgesamt ${count} Kanäle`);
});

redisSubscriber.on('message', (channel, message) => {
  logger.debug(`📨 [REDIS] Nachricht auf ${channel} empfangen: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
});

// Pub/Sub-Mechanismus
export const redisPubSub = {
  // Veröffentliche ein Event
  publish: async <K extends keyof RedisEvents>(channel: K, message: RedisEvents[K]): Promise<void> => {
    try {
      // Explizite Umwandlung, da Redis nur Strings akzeptiert
      const channelStr = String(channel);
      await redisPublisher.publish(channelStr, JSON.stringify(message));
      logger.info(`Event an Redis auf Kanal ${channelStr} gesendet:`, message);
    } catch (err) {
      logger.error('Fehler beim Senden an Redis:', err);
    }
  },

  // Subscribe mit Typsicherheit
  subscribe: <K extends keyof RedisEvents>(channel: K, callback: (message: RedisEvents[K]) => void) => {
    const channelStr = String(channel);
    logger.info(`🔔 Abonniere Redis-Kanal: ${channelStr}`);

    try {
      // Schritt 1: Kanal abonnieren
      redisSubscriber.subscribe(channelStr, (err) => {
        if (err) {
          logger.error(`❌ Abonnement für ${channelStr} fehlgeschlagen:`, err);
          return;
        }
        logger.info(`✅ Erfolgreich auf ${channelStr} abonniert`);
      });

      // Schritt 2: Nachrichten verarbeiten
      redisSubscriber.on('message', (chan, message) => {
        if (chan === channelStr) {
          logger.debug(`📨 [REDIS] Nachricht auf ${chan} empfangen`);
          
          try {
            const parsed = JSON.parse(message);
            logger.debug('📄 Parsed content:', parsed);
            callback(parsed);
          } catch (err) {
            logger.error('❌ FEHLER beim Parsen:', {
              error: (err as Error)?.message || 'Unknown error',
              rawData: message
            });
          }
        }
      });
    } catch (error) {
      logger.error(`❌ Allgemeiner Fehler beim Abonnieren von ${channelStr}:`, error);
    }
    
    return {
      unsubscribe: () => {
        // Explizite Umwandlung für Redis-Methoden
        redisSubscriber.unsubscribe(String(channel));
        logger.info(`🛑 Abonnement von ${String(channel)} beendet`);
      }
    };
  },

  redisPublisher,
  redisSubscriber,
};