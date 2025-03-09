//apps\api\src\redis\redis.module.ts
import { Global, Module, Logger } from '@nestjs/common';

import { Redis } from 'ioredis';
import { RedisPubSubService } from './redis-pubsub.service';

const REDIS_CLIENT = 'REDIS_CLIENT';
const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);

        const redis = new Redis({
          host,
          port,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          connectionName: 'NestJS-Main',
          enableOfflineQueue: true
        });

        // Behalte ALLE Original-Ereignislistener bei
        redis
          .on('connect', () => {
            logger.log(`Verbinde zu Redis unter ${host}:${port}...`);
            console.log('[Legacy] Redis connect event');
          })
          .on('ready', () => {
            logger.log('Redis-Verbindung erfolgreich hergestellt ✅');
            console.log('[Legacy] Redis ready event');
            console.log('[Redis] Verbindung steht für Befehle bereit');
          })
          .on('error', (err) => {
            logger.error(`Redis-Fehler: ${err.message}`);
            console.error('[Legacy] Redis error:', err);
          })
          .on('close', () => {
            logger.warn('Redis-Verbindung geschlossen');
            console.warn('[Legacy] Redis connection closed');
          })
          .on('reconnecting', (ms) => {
            logger.warn(`Neuverbindung in ${ms}ms`);
            console.log(`[Legacy] Redis reconnecting in ${ms}ms`);
          });

        return redis;
      },
    },
    RedisPubSubService,
  ],
  exports: [REDIS_CLIENT, RedisPubSubService],
})
export class RedisModule {}