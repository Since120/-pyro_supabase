import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryResolver } from './category.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueueModule
  ],
  providers: [
    CategoryService,
    CategoryResolver,
  ],
  exports: [
    CategoryService,
  ],
})
export class CategoryModule {}