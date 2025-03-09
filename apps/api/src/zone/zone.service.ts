import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { Zone, ZoneCreateInput, ZoneUpdateInput, ZoneEvent } from './models/zone.model';
import { QueueService, JOB_TYPES } from '../queue/queue.service';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger(ZoneService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisPubSub: RedisPubSubService,
    private readonly queueService: QueueService
  ) {
    // Event-Handler registrieren
    this.registerEventHandlers();
  }

  /**
   * Registriert Event-Handler für Redis PubSub Events
   */
  private registerEventHandlers(): void {
    // Handler für Zone Events
    this.redisPubSub.subscribe('zoneEvent', 
      (payload: ZoneEvent) => this.handleZoneEvent(payload)
    );
  }

  /**
   * Verarbeitet Zone Events von externen Quellen (wie dem Bot)
   */
  private async handleZoneEvent(payload: ZoneEvent): Promise<void> {
    try {
      this.logger.log(`Zone Event empfangen: ${payload.eventType} für ID ${payload.id}`);
      
      // Nach Event-Typ verarbeiten
      switch (payload.eventType) {
        case 'confirmation':
          // Verarbeite die Bestätigung einer Zone-Erstellung vom Bot
          if (payload.discordVoiceId) {
            await this.prisma.zone.update({
              where: { id: payload.id },
              data: { discordVoiceId: payload.discordVoiceId }
            });
            this.logger.log(`Zone ${payload.id} mit Discord ID ${payload.discordVoiceId} aktualisiert`);
          }
          break;
          
        case 'updateConfirmed':
          // Verarbeite die Bestätigung einer Zone-Aktualisierung - nur Logging
          this.logger.log(`Zone-Aktualisierung bestätigt für ${payload.id}`);
          break;
          
        case 'deleteConfirmed':
          // Verarbeite die Bestätigung einer Zone-Löschung - nur Logging
          this.logger.log(`Zone-Löschung bestätigt für ${payload.id}`);
          break;
          
        case 'error':
          // Verarbeite Fehler-Events
          this.logger.error(`Fehler-Event für Zone ${payload.id}: ${payload.message || 'Unbekannter Fehler'}`);
          break;
          
        default:
          this.logger.warn(`Unbehandelter Zone-Event-Typ: ${payload.eventType}`);
      }
    } catch (error: any) {
      this.logger.error(`Fehler bei der Verarbeitung eines Zone-Events: ${error.message}`, error.stack);
    }
  }

  /**
   * Mappt ein Prisma Zone Objekt auf ein Zone Model
   */
  private mapZone(zone: any): Zone {
    return {
      ...zone,
      lastUsageAt: zone.lastUsageAt ?? undefined,
      discordVoiceId: zone.discordVoiceId ?? undefined,
      isDeletedInDiscord: zone.isDeletedInDiscord ?? false,
      totalSecondsInZone: zone.totalSecondsInZone ?? 0,
      category: zone.category ? this.mapCategory(zone.category) : null
    };
  }

  /**
   * Mappt ein Prisma Category Objekt auf ein Category Model
   */
  private mapCategory(category: any) {
    return category ? {
      ...category,
      totalSecondsInCategory: category.totalSecondsInCategory ?? 0,
      lastUsageAt: category.lastUsageAt ?? undefined,
      discordCategoryId: category.discordCategoryId ?? undefined,
      isTrackingActive: category.isTrackingActive ?? false,
      isSendSetup: category.isSendSetup ?? false,
      isDeletedInDiscord: category.isDeletedInDiscord ?? false,
      isVisible: category.isVisible ?? true,
      guildId: category.guildId ?? ''
    } : null;
  }

  /**
   * Erstellt eine neue Zone
   */
  async createZone(input: ZoneCreateInput): Promise<Zone> {
    try {
      // Prüfe, ob die angegebene Kategorie existiert
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: input.categoryId }
      });
  
      if (!categoryExists) {
        throw new BadRequestException(`Kategorie mit ID ${input.categoryId} existiert nicht`);
      }
  
      const zone = await this.prisma.zone.create({
        data: {
          zoneKey: input.zoneKey,
          name: input.name,
          minutesRequired: input.minutesRequired,
          pointsGranted: input.pointsGranted,
          lastUsageAt: input.lastUsageAt,
          totalSecondsInZone: input.totalSecondsInZone ?? 0,
          isDeletedInDiscord: input.isDeletedInDiscord ?? false,
          categoryId: input.categoryId,
          discordVoiceId: input.discordVoiceId
        },
        include: { category: true },
      });
  
      // Bei Zone-Erstellung explizit das discordCategoryId Feld mitgeben
      if (!input.discordVoiceId && categoryExists.discordCategoryId) {
        this.logger.log(`Sende Zone-Erstellung direkt an Redis: ${zone.id}`);
        await this.redisPubSub.publish('zoneEvent', {
          id: zone.id,
          eventType: 'created',
          name: zone.name,
          categoryId: zone.categoryId,
          discordCategoryId: categoryExists.discordCategoryId,
          timestamp: new Date().toISOString()
        });
      }
  
      return this.mapZone(zone);
    } catch (error) {
      this.logger.error(`Fehler beim Erstellen der Zone: ${error.message}`, error.stack);
      
      // Prüfe auf spezifische Datenbankfehler
      if (error.code === 'P2002') {
        throw new BadRequestException('Eine Zone mit diesem Schlüssel existiert bereits');
      }
      
      throw error;
    }
  }
  /**
   * Ruft alle Zonen ab
   */
  async getZones(): Promise<Zone[]> {
    try {
      const zones = await this.prisma.zone.findMany({
        include: { category: true },
      });
      
      return zones.map(zone => this.mapZone(zone));
    } catch (error) {
      this.logger.error(`Fehler beim Abrufen der Zonen: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Ruft eine einzelne Zone anhand ihrer ID ab
   */
  async getZoneById(id: string): Promise<Zone> {
    try {
      const zone = await this.prisma.zone.findUnique({
        where: { id },
        include: { category: true }
      });
      
      if (!zone) {
        throw new NotFoundException(`Zone mit ID ${id} nicht gefunden`);
      }
      
      return this.mapZone(zone);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Fehler beim Abrufen der Zone ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Aktualisiert eine Zone
   */
  async updateZone(id: string, input: ZoneUpdateInput): Promise<Zone> {
    try {
      this.logger.log(`Aktualisiere Zone mit ID: ${id}`);
      
      // Prüfe, ob die Zone existiert
      const existingZone = await this.prisma.zone.findUnique({
        where: { id },
        include: { category: true }
      });
      
      if (!existingZone) {
        throw new NotFoundException(`Zone mit ID ${id} nicht gefunden`);
      }

      // Wenn categoryId geändert wird, prüfe ob die neue Kategorie existiert
      if (input.categoryId && input.categoryId !== existingZone.categoryId) {
        const categoryExists = await this.prisma.category.findUnique({
          where: { id: input.categoryId }
        });
        
        if (!categoryExists) {
          throw new BadRequestException(`Kategorie mit ID ${input.categoryId} existiert nicht`);
        }
      }

      // Aktualisiere nur die angegebenen Felder
      const updatedZone = await this.prisma.zone.update({
        where: { id },
        data: {
          zoneKey: input.zoneKey,
          name: input.name,
          minutesRequired: input.minutesRequired,
          pointsGranted: input.pointsGranted,
          lastUsageAt: input.lastUsageAt,
          totalSecondsInZone: input.totalSecondsInZone,
          isDeletedInDiscord: input.isDeletedInDiscord,
          categoryId: input.categoryId,
          discordVoiceId: input.discordVoiceId
        },
        include: { category: true },
      });
      
      // Prüfe, ob Name geändert wurde und Discord-Update notwendig ist
      if (input.name !== undefined && 
          input.name !== existingZone.name && 
          updatedZone.discordVoiceId && 
          updatedZone.category?.discordCategoryId) {
        
        this.logger.log(`Erstelle Job für Zone-Update in Discord: ${updatedZone.id}`);
        await this.queueService.addZoneJob(
          JOB_TYPES.UPDATE_ZONE,
          {
            name: updatedZone.name,
            categoryId: updatedZone.categoryId,
            discordVoiceId: updatedZone.discordVoiceId,
            discordCategoryId: updatedZone.category.discordCategoryId
          },
          updatedZone.id
        );
      }
      
      this.logger.log(`Zone ${id} erfolgreich aktualisiert`);
      return this.mapZone(updatedZone);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Fehler beim Aktualisieren der Zone ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Löscht eine Zone
   */
  async deleteZone(id: string): Promise<Zone> {
    try {
      this.logger.log(`Lösche Zone mit ID: ${id}`);
      
      // Prüfe, ob die Zone existiert
      const existingZone = await this.prisma.zone.findUnique({
        where: { id },
        include: { category: true }
      });
      
      if (!existingZone) {
        throw new NotFoundException(`Zone mit ID ${id} nicht gefunden`);
      }
      
      // Lösche die Zone
      const deletedZone = await this.prisma.zone.delete({
        where: { id },
        include: { category: true },
      });
      
      // Direkte Redis-Kommunikation für Zone-Löschung
      if (deletedZone.discordVoiceId && deletedZone.category?.discordCategoryId) {
        this.logger.log(`Sende Zone-Löschung direkt an Redis: ${deletedZone.id}`);
        await this.redisPubSub.publish('zoneEvent', {
          id: deletedZone.id,
          eventType: 'deleted',
          name: deletedZone.name,
          categoryId: deletedZone.categoryId,
          discordVoiceId: deletedZone.discordVoiceId,
          discordCategoryId: deletedZone.category.discordCategoryId, // Wichtig: discordCategoryId aus der Kategorie mitgeben
          timestamp: new Date().toISOString()
        });
      }
      
      this.logger.log(`Zone ${id} erfolgreich gelöscht`);
      return this.mapZone(deletedZone);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Fehler beim Löschen der Zone ${id}: ${error.message}`, error.stack);
      
      if (error.code === 'P2025') {
        throw new NotFoundException(`Zone mit ID ${id} wurde bereits gelöscht oder existiert nicht`);
      }
      
      throw error;
    }
  }
}