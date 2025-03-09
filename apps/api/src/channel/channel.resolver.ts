import { Query, Resolver, Subscription, Args, ID } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { DiscordChannel, DiscordChannelFilter, ChannelEvent } from './models/channel.model';
import { RedisPubSubService } from '../redis/redis-pubsub.service';

@Resolver(() => DiscordChannel)
export class ChannelResolver {
  private readonly logger = new Logger(ChannelResolver.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly redisPubSub: RedisPubSubService
  ) {}

  @Query(() => [DiscordChannel], {
    description: 'Gibt alle Discord-Channels für die Standardguild zurück'
  })
  async discordChannels() {
    this.logger.log('Discord-Channels werden abgerufen...');
    return this.channelService.getDiscordChannels(process.env.GUILD_ID!);
  }

  @Query(() => [DiscordChannel], {
    description: 'Gibt Discord-Channels für eine bestimmte Guild zurück'
  })
  async discordChannelsByGuild(
    @Args('guildId') guildId: string,
    @Args('filter', { nullable: true }) filter?: DiscordChannelFilter
  ) {
    this.logger.log(`Discord-Channels für Guild ${guildId} werden abgerufen...`);
    const channels = await this.channelService.getDiscordChannels(guildId);
    
    // Filtere die Channels, falls ein Filter angegeben wurde
    if (filter) {
      return channels.filter(channel => {
        // Filter nach Namen
        if (filter.name && !channel.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }
        
        // Filter nach Typ
        if (filter.type && channel.type !== filter.type) {
          return false;
        }
        
        // Filter nach übergeordneter Kategorie
        if (filter.parentId && channel.parentId !== filter.parentId) {
          return false;
        }
        
        return true;
      });
    }
    
    return channels;
  }

  @Query(() => DiscordChannel, {
    description: 'Gibt einen Discord-Channel anhand seiner ID zurück'
  })
  async discordChannelById(
    @Args('guildId') guildId: string,
    @Args('channelId', { type: () => ID }) channelId: string
  ) {
    this.logger.log(`Discord-Channel mit ID ${channelId} wird abgerufen...`);
    return this.channelService.getDiscordChannelById(guildId, channelId);
  }

  @Subscription(() => ChannelEvent, {
    name: 'channelEvent',
    description: 'Abonniere alle Discord-Channel Events',
    filter: (payload, variables) => {
      // Hier könnte Filterlogik hinzugefügt werden, falls erforderlich
      return true;
    }
  })
  channelEvent() {
    return this.redisPubSub.asyncIterator('channelEvent');
  }
}