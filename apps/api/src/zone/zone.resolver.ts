import { Resolver, Query, Mutation, Args, Subscription, ID } from '@nestjs/graphql';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Zone, ZoneCreateInput, ZoneUpdateInput, ZoneEvent } from './models/zone.model';
import { ZoneService } from './zone.service';
import { RedisPubSubService } from '../redis/redis-pubsub.service';

@Resolver(() => Zone)
export class ZoneResolver {
  private readonly logger = new Logger(ZoneResolver.name);

  constructor(
    private readonly zoneService: ZoneService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  @Query(() => [Zone], { 
    name: 'zones',
    description: 'Gibt alle Zonen zurück' 
  })
  async getZones(): Promise<Zone[]> {
    this.logger.log('Zonen werden abgerufen...');
    return this.zoneService.getZones();
  }

  @Query(() => Zone, {
    name: 'zone',
    description: 'Gibt eine einzelne Zone anhand ihrer ID zurück'
  })
  async getZoneById(
    @Args('id', { type: () => ID }) id: string
  ): Promise<Zone> {
    this.logger.log(`Zone mit ID ${id} wird abgerufen`);
    const zone = await this.zoneService.getZoneById(id);
    
    if (!zone) {
      throw new NotFoundException(`Zone mit ID ${id} nicht gefunden`);
    }
    
    return zone;
  }

  @Mutation(() => Zone, { 
    name: 'createZone',
    description: 'Erstellt eine neue Zone' 
  })
  async createZone(
    @Args('input') input: ZoneCreateInput
  ): Promise<Zone> {
    this.logger.log('Zone wird erstellt mit Input', input);

    try {
      // Die Event-Veröffentlichung und Rate-Limit-Prüfung wird jetzt vom ZoneService gehandhabt
      const zone = await this.zoneService.createZone(input);
      return zone;
    } catch (error) {
      this.logger.error('Fehler bei der Zonenerstellung', error);
      throw error;
    }
  }

  @Mutation(() => Zone, { 
    name: 'updateZone',
    description: 'Aktualisiert eine existierende Zone'
  })
  async updateZone(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ZoneUpdateInput,
  ): Promise<Zone> {
    // Die QueueService-Logik für Rate-Limiting ist nun im ZoneService implementiert
    return this.zoneService.updateZone(id, input);
  }

  @Mutation(() => Zone, { 
    name: 'deleteZone',
    description: 'Löscht eine Zone'
  })
  async deleteZone(
    @Args('id', { type: () => ID }) id: string
  ): Promise<Zone> {
    this.logger.log(`Zone mit ID ${id} wird gelöscht`);
    // Die Event-Veröffentlichung ist nun im ZoneService implementiert
    return this.zoneService.deleteZone(id);
  }

  @Subscription(() => ZoneEvent, {
    name: 'zoneEvent',
    description: 'Abonniere alle Zone-Events',
    nullable: true,
    filter: (payload, variables) => {
      if (!payload) {
        return false;
      }
      return true;
    },
    resolve: (payload) => {
      if (!payload) {
        return null;
      }
      return payload;
    }
  })
  zoneEvent() {
    return this.redisPubSub.asyncIterator('zoneEvent');
  }
}