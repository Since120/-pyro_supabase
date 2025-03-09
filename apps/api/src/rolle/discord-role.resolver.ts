import { Query, Resolver, Subscription, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { RolesService } from './discord-role.service';
import { DiscordRole, DiscordRoleFilter, RoleEvent } from './models/discord-role.model';
import { RedisPubSubService } from '../redis/redis-pubsub.service';

@Resolver(() => DiscordRole)
export class DiscordRoleResolver {
  private readonly logger = new Logger(DiscordRoleResolver.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly redisPubSub: RedisPubSubService
  ) {}

  @Query(() => [DiscordRole], {
    description: 'Gibt alle Discord-Rollen für die Standardguild zurück'
  })
  async discordRoles() {
    return this.rolesService.getDiscordRoles(process.env.GUILD_ID!);
  }

  @Query(() => [DiscordRole], {
    description: 'Gibt Discord-Rollen für eine bestimmte Guild zurück'
  })
  async discordRolesByGuild(
    @Args('guildId') guildId: string,
    @Args('filter', { nullable: true }) filter?: DiscordRoleFilter
  ) {
    const roles = await this.rolesService.getDiscordRoles(guildId);
    
    // Filtere die Rollen, falls ein Filter angegeben wurde
    if (filter) {
      return roles.filter(role => {
        // Filter nach Namen
        if (filter.name && !role.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }
        
        // Filter nach Erwähnbarkeit
        if (filter.isMentionable !== undefined && role.isMentionable !== filter.isMentionable) {
          return false;
        }
        
        // Filter nach Verwaltung
        if (filter.isManaged !== undefined && role.isManaged !== filter.isManaged) {
          return false;
        }
        
        return true;
      });
    }
    
    return roles;
  }

  @Subscription(() => RoleEvent, {
    name: 'roleEvent',
    description: 'Abonniere alle Discord-Rollen Events',
    filter: (payload, variables) => {
      // Hier könnte Filterlogik hinzugefügt werden, falls erforderlich
      return true;
    }
  })
  roleEvent() {
    return this.redisPubSub.asyncIterator('roleEvent');
  }
}