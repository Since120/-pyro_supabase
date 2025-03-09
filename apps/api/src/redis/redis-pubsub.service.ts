// apps/api/src/redis/redis-pubsub.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Redis } from 'ioredis';
import { PubSubEvents, PubSubSubscription } from './models/pubsub.model';

const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisPubSubService {
  private readonly logger = new Logger(RedisPubSubService.name);
  private pubSub: RedisPubSub;
  private publisher: Redis;
  private subscriber: Redis;
  private isSubscribed = false;

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {
    this.initializePubSub();
    this.setupEventHandlers();
  }

  /**
   * Initialisiert die PubSub-Instanz mit separaten Redis-Connections für Publisher und Subscriber
   */
  private initializePubSub(): void {
    this.publisher = new Redis({
      ...this.redisClient.options,
      connectionName: 'NestJS-Publisher',
      enableOfflineQueue: true,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.subscriber = new Redis({
      ...this.redisClient.options,
      connectionName: 'NestJS-Subscriber',
      enableOfflineQueue: true,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.pubSub = new RedisPubSub({
      publisher: this.publisher,
      subscriber: this.subscriber,
      connectionListener: (err) => {
        if (err) this.logger.error('Redis connection error', err);
      }
    });
  }

  /**
   * Richtet Event-Handler für Redis-Events ein
   */
  private setupEventHandlers(): void {
    const subscriptionHandler = () => {
      if (this.isSubscribed) return;
      
      // Abonniere BEIDE wichtigen Event-Kanäle
      const channels = ['categoryEvent', 'zoneEvent'];
      
      channels.forEach(channel => {
        this.subscriber.subscribe(channel, (err) => {
          if (err) {
            this.logger.error(`Abonnement für ${channel} fehlgeschlagen`, err);
          } else {
            this.isSubscribed = true;
            this.logger.log(`🔔 Erfolgreich auf ${channel} abonniert`);
          }
        });
      });
    };

    this.subscriber
      .once('ready', subscriptionHandler)
      .on('message', (channel: string, message: string) => {
        // Debug-Logging für empfangene Nachrichten
        this.logger.debug(`📬 Redis Nachricht auf Kanal ${channel} empfangen: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      });

    this.publisher.on('ready', () => {
      this.logger.log('✅ Redis Publisher bereit');
    });
  }

  /**
   * Veröffentlicht ein Event auf einem Redis-Kanal
   */
  async publish<K extends keyof PubSubEvents>(
    channel: K,
    payload: PubSubEvents[K]
  ): Promise<void> {
    try {
      const stringified = JSON.stringify(payload, null, 2);
      
      this.logger.log(`🚀 Sende an Redis ${channel}: ${stringified.substring(0, 200)}...`);
      
      // Legacy-Logging beibehalten
      console.info(`[Legacy] Sende an Redis ${channel}:`, payload);
  
      await this.pubSub.publish(channel, payload);
      this.logger.log(`✅ Event erfolgreich an Redis ${channel} gesendet`);
    } catch (err) {
      this.logger.error(`🚨 Fehler beim Senden an ${channel}: ${err.message}`, err.stack);
      console.error('[Legacy] Fehler:', err);
      throw err;
    }
  }
  
  /**
   * Abonniert einen Redis-Kanal und führt eine Callback-Funktion bei neuen Nachrichten aus
   */
  subscribe<K extends keyof PubSubEvents>(
    channel: K,
    callback: (payload: PubSubEvents[K]) => void
  ): PubSubSubscription<PubSubEvents[K]> {
    this.logger.log(`🔔 Starte Abonnement für ${channel}`);
    
    this.pubSub.subscribe(channel, (payload: PubSubEvents[K]) => {
      // Beide Logging-Varianten
      this.logger.log(`📥 Event auf ${channel} empfangen`);
      callback(payload);
    });

    return {
      unsubscribe: () => {
        // Direkter Zugriff auf den Redis-Client umgeht typische Typprobleme
        this.subscriber.unsubscribe(String(channel));
        this.logger.log(`🛑 Abonnement von ${String(channel)} beendet`);
      }
    };
  }

  /**
   * Erzeugt einen AsyncIterator für GraphQL-Subscriptions
   */
  asyncIterator<K extends keyof PubSubEvents>(channel: K) {
    this.logger.log(`🎯 Neue Subscription für '${channel}'`);
    
    const originalIterator = this.pubSub.asyncIterator<PubSubEvents[K]>(channel);
    
    return {
      ...originalIterator,
      next: async () => {
        try {
          const result = await originalIterator.next();
          if (!result.done) {
            this.logger.verbose({
              message: `📢 Event an GraphQL gesendet für ${channel}:`,
              data: JSON.stringify(result.value, null, 2)
            });
          }
          return result;
        } catch (error) {
          this.logger.error(`🚨 Fehler in AsyncIterator (${channel}):`, error);
          throw error;
        }
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
}