import { Module } from '@nestjs/common';
import { DiscordRoleResolver } from './discord-role.resolver';
import { RolesService } from './discord-role.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [DiscordRoleResolver, RolesService],
  exports: [RolesService],
})
export class DiscordRoleModule {}