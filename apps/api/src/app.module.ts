import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { TempResolver } from './temp.resolver';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { DiscordRoleModule } from './rolle/discord-role.module';
import { ZoneModule } from './zone/zone.module';
import { ChannelModule } from './channel/channel.module'; // Neues Channel-Modul
import { AllExceptionsFilter } from './common/filters/all.exceptions.filter';
import { RedisModule } from './redis/redis.module';
import { RedisPubSubService } from './redis/redis-pubsub.service';
import { HealthController } from './health/health.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebSocketLink } from '@apollo/client/link/ws';
import { QueueModule } from './queue/queue.module';


@Module({
  imports: [
    // 1. Module-Imports
    PrismaModule,
    QueueModule,
    CategoryModule,
    DiscordRoleModule,
    ZoneModule,
    ChannelModule, // Neues Channel-Modul hinzugefügt
    RedisModule,

    // 2. GraphQL-Modul
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [RedisModule],
      inject: [RedisPubSubService],
      useFactory: (pubSub: RedisPubSubService) => ({
        debug: true,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        buildSchemaOptions: {
          dateScalarMode: 'timestamp'
        },
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
            onConnect: (context) => {
              const connectionParams = context.connectionParams;
              console.log('WebSocket connected with params:', connectionParams);
              return { 
                guild_id: 'default_guild_id',
                req: { headers: connectionParams } 
              };
            }
          },
          'subscriptions-transport-ws': {
            path: '/graphql',
            onConnect: (connectionParams) => {
              console.log('Legacy WS connected:', connectionParams);
              return true;
            }
          }
        },
        context: ({ req, connection }) => ({
          ...(connection?.context || {}),
          req: req || connection?.context?.req,
          pubSub: pubSub
        }),
        playground: {
          settings: {
            'request.credentials': 'include',
            'editor.theme': 'dark'
          }
        },
        introspection: true
      })
    })
  ],
  controllers: [AppController, HealthController],
  providers: [
    TempResolver,
    AppService,
    {
      provide: WebSocketLink,
      useFactory: () => {
        return new WebSocketLink({
          uri: `ws://${process.env.API_URL}/graphql`,
          options: {
            reconnect: true
          }
        });
      }
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    }
  ]
})
export class AppModule {}