import { Injectable, Logger } from '@nestjs/common';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { DiscordRole, RoleEvent } from './models/discord-role.model';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly redisPubSub: RedisPubSubService) {}

  /**
   * Ruft Discord-Rollen für eine bestimmte Guild ab
   * Kommuniziert mit dem Bot über Redis PubSub
   */
  async getDiscordRoles(guildId: string): Promise<DiscordRole[]> {
    const requestId = Math.random().toString(36).slice(2, 11);
    this.logger.log(`Fordere Discord-Rollen für Guild ${guildId} an (requestId: ${requestId})`);
    
    return new Promise((resolve, reject) => {
      // Timeout für die Anfrage
      const timeout = setTimeout(() => {
        reject(new Error('Timeout beim Abrufen der Rollen'));
      }, 5000);

      // Abonniere den Response-Kanal
      this.redisPubSub.subscribe('roleEvent', (payload: RoleEvent) => {
        if (payload.requestId === requestId && payload.eventType === 'response') {
          clearTimeout(timeout);
          
          if (payload.error) {
            this.logger.error(`Fehler bei Rollenanfrage: ${payload.error}`);
            reject(new Error(payload.error));
          }
          
          if (payload.roles) {
            this.logger.log(`${payload.roles.length} Rollen empfangen für Guild ${guildId}`);
            resolve(payload.roles);
          }
        }
      });

      // Sende die Anfrage
      this.redisPubSub.publish('roleEvent', {
        requestId,
        guildId,
        timestamp: new Date().toISOString(),
        eventType: 'request'
      } as RoleEvent);
    });
  }
}