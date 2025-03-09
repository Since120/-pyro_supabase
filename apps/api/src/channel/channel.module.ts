import { Module } from '@nestjs/common';
import { ChannelResolver } from './channel.resolver';
import { ChannelService } from './channel.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [ChannelResolver, ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}