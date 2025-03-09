import { Injectable, Logger } from '@nestjs/common';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { DiscordChannel, ChannelEvent } from './models/channel.model';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(private readonly redisPubSub: RedisPubSubService) {}

  /**
   * Ruft Discord-Channels für eine bestimmte Guild ab
   * Kommuniziert mit dem Bot über Redis PubSub
   */
  async getDiscordChannels(guildId: string): Promise<DiscordChannel[]> {
    const requestId = Math.random().toString(36).slice(2, 11);
    this.logger.log(`Fordere Discord-Channels für Guild ${guildId} an (requestId: ${requestId})`);
    
    return new Promise((resolve, reject) => {
      // Timeout für die Anfrage
      const timeout = setTimeout(() => {
        reject(new Error('Timeout beim Abrufen der Channels'));
      }, 5000);

      // Abonniere den Response-Kanal
      this.redisPubSub.subscribe('channelEvent', (payload: ChannelEvent) => {
        if (payload.requestId === requestId && payload.eventType === 'response') {
          clearTimeout(timeout);
          
          if (payload.error) {
            this.logger.error(`Fehler bei Channelanfrage: ${payload.error}`);
            reject(new Error(payload.error));
          }
          
          if (payload.channels) {
            resolve(payload.channels);
          }
        }
      });

      // Sende die Anfrage
      this.redisPubSub.publish('channelEvent', {
        requestId,
        guildId,
        timestamp: new Date().toISOString(),
        eventType: 'request'
      } as ChannelEvent);
    });
  }
  
  /**
   * Ruft einen Discord-Channel anhand seiner ID ab
   */
  async getDiscordChannelById(guildId: string, channelId: string): Promise<DiscordChannel> {
    const channels = await this.getDiscordChannels(guildId);
    const channel = channels.find(c => c.id === channelId);
    
    if (!channel) {
      throw new Error(`Channel mit ID ${channelId} nicht gefunden`);
    }
    
    return channel;
  }
}