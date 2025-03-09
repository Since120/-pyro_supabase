// apps/api/src/health/health.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { WebSocketLink } from '@apollo/client/link/ws';

const REDIS_CLIENT = 'REDIS_CLIENT';

@Controller()
export class HealthController {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly wsLink: WebSocketLink
  ) {}

  @Get('/health')
  getHealth() {
    // Behalte bestehende Logs bei
    console.log('[Legacy] Health check called');
    
    return {
      websocket: Boolean(this.wsLink['subscriptionClient']?.status === 'connected'),
      redis: this.redis.status === 'ready',
      timestamp: new Date().toISOString(),
      legacyCheck: '[OK]',
      additionalInfo: {
        redisHost: this.redis.options.host,
        redisPort: this.redis.options.port
      }
    };
  }
}