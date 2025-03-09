import { Module } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { ZoneResolver } from './zone.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueueModule
  ],
  providers: [
    ZoneService,
    ZoneResolver
  ],
  exports: [
    ZoneService
  ],
})
export class ZoneModule {}