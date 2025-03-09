import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { Category, CategoryEvent } from './models/category.model';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { QueueService, JOB_TYPES } from '../queue/queue.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisPubSub: RedisPubSubService,
    private readonly queueService: QueueService  // QueueService hinzufügen
  ) {
    // Event-Handler registrieren
    this.registerEventHandlers();
  }

  /**
   * Registriert Event-Handler für Redis PubSub Events
   */
  private registerEventHandlers(): void {
    // Handler für alle Category Events
    this.redisPubSub.subscribe('categoryEvent', 
      (payload: CategoryEvent) => this.handleCategoryEvent(payload)
    );
  }

  /**
   * Verarbeitet alle Category Events
   */
  private async handleCategoryEvent(payload: CategoryEvent): Promise<void> {
    if (!payload || !payload.id) {
      this.logger.warn('Received invalid category event payload:', payload);
      return;
    }

    try {
      this.logger.log(`Category event received: ${payload.eventType} for ID ${payload.id}`);
      
      // Process based on event type
      switch (payload.eventType) {
        case 'updated':
          await this.handleUpdateEvent(payload);
          break;
          
        case 'confirmation':
          await this.handleConfirmationEvent(payload);
          break;
          
        case 'updateConfirmed':
          this.logger.log(`Update confirmed for category ${payload.id}`);
          break;
          
        case 'deleteConfirmed':
          this.logger.log(`Deletion confirmed for category ${payload.id}`);
          break;
          
        case 'error':
          this.logger.error(`Error for category ${payload.id}: ${payload.error || 'Unknown error'}`);
          // Keine Weitergabe des Fehlers, um Endlosschleifen zu vermeiden
          break;
          
        default:
          this.logger.log(`Unhandled event type: ${payload.eventType}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing category event: ${error.message}`, error.stack);
      
      try {
        // Fehlerdetails anreichern und loggen (aber nicht weitergeben, um Endlosschleifen zu vermeiden)
        const errorEvent: CategoryEvent = {
          id: payload.id,
          guildId: payload.guildId || 'unknown',
          name: payload.name || 'Unknown',
          timestamp: new Date().toISOString(),
          eventType: 'error',
          error: `API Error: ${error.message}`,
          details: JSON.stringify({
            originalEventType: payload.eventType,
            stackTrace: error.stack,
            prismaError: error instanceof PrismaClientKnownRequestError ? {
              code: error.code,
              meta: error.meta,
              clientVersion: error.clientVersion
            } : undefined
          })
        };
  
        // Nur in Logs schreiben, um Endlosschleifen zu vermeiden
        this.logger.error('Error event created but not published:', errorEvent);
      } catch (pubSubError) {
        this.logger.error('Failed to create error event:', pubSubError);
      }
    }
  }

  /**
   * Verarbeitet Update-Events (z.B. vom Bot)
   */
  private async handleUpdateEvent(payload: CategoryEvent): Promise<void> {
    // Nur verarbeiten wenn alle erforderlichen Felder vorhanden sind
    if (!payload.id) {
      throw new BadRequestException('Update event missing required field: id');
    }

    // Prüfe ob die Kategorie existiert
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: payload.id }
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${payload.id} not found for update event`);
    }

    // Bereite Update-Daten vor - nur Felder aktualisieren, die im Event enthalten sind
    const updateData: any = {
      updatedAt: new Date()
    };

    if (payload.discordCategoryId) {
      updateData.discordCategoryId = payload.discordCategoryId;
    }

    if (payload.name) {
      updateData.name = payload.name;
    }

    if (payload.guildId) {
      updateData.guildId = payload.guildId;
    }

    // Führe Update durch mit Transaktionssicherheit
    try {
      const updatedCategory = await this.prisma.$transaction(async (tx) => {
        const result = await tx.category.update({
          where: { id: payload.id },
          data: updateData
        });
        return result;
      });

      this.logger.log(`Category ${payload.id} was successfully updated with data:`, updateData);
      
      // Bestätigungsevent senden
      await this.redisPubSub.publish('categoryEvent', {
        id: updatedCategory.id,
        guildId: updatedCategory.guildId,
        name: updatedCategory.name,
        discordCategoryId: updatedCategory.discordCategoryId,
        timestamp: new Date().toISOString(),
        eventType: 'updateConfirmed'
      } as CategoryEvent);
    } catch (error) {
      this.logger.error(`Failed to update category ${payload.id}:`, error);
      throw error;
    }
  }

  /**
   * Verarbeitet Bestätigungsevents (wenn z.B. der Bot eine Kategorie erstellt hat)
   */
  private async handleConfirmationEvent(payload: CategoryEvent): Promise<void> {
    // Prüfe, ob es sich um ein selbst-gesendetes Event handelt
    // Wenn ein API_ORIGIN-Flag gesetzt ist, ignorieren wir das Event, um Schleifen zu vermeiden
    if (payload.details && payload.details.includes('API_ORIGIN')) {
      this.logger.log(`Ignoring self-published confirmation event for category ${payload.id}`);
      return;
    }
    
    // Validiere erforderliche Felder
    if (!payload.id || !payload.discordCategoryId) {
      throw new BadRequestException('Confirmation event missing required fields: id or discordCategoryId');
    }

    // Prüfe ob die Kategorie existiert
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: payload.id }
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${payload.id} not found for confirmation event`);
    }

    // Aktualisiere die Kategorie mit der Discord-Kategorie-ID in einer Transaktion
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.category.update({
          where: { id: payload.id },
          data: {
            discordCategoryId: payload.discordCategoryId,
            updatedAt: new Date()
          }
        });
      });

      this.logger.log(`Category ${payload.id} with Discord ID ${payload.discordCategoryId} confirmed and updated`);
      
      // WICHTIG: Das Confirmation-Event nur EINMAL weiterleiten (mit API_ORIGIN-Marker)
      // GraphQL-Clients erhalten dadurch das von der API geprüfte und bereinigte Event
      await this.redisPubSub.publish('categoryEvent', {
        id: payload.id,
        guildId: payload.guildId || 'unknown',
        name: payload.name || 'Unknown',
        discordCategoryId: payload.discordCategoryId,
        timestamp: new Date().toISOString(),
        eventType: 'confirmation',
        details: JSON.stringify({ API_ORIGIN: true }) // Marker, dass dieses Event von der API kommt
      } as CategoryEvent);
    } catch (error) {
      this.logger.error(`Failed to update category ${payload.id} with confirmation:`, error);
      throw error;
    }
  }

  /**
   * Mappt ein Prisma Category Objekt auf ein Category Model
   */
  private mapCategory(category: any): Category {
    return {
      ...category,
      totalSecondsInCategory: category.totalSecondsInCategory ?? 0,
      lastUsageAt: category.lastUsageAt ?? undefined,
      discordCategoryId: category.discordCategoryId ?? undefined,
      isTrackingActive: category.isTrackingActive ?? false,
      isSendSetup: category.isSendSetup ?? false,
      isDeletedInDiscord: category.isDeletedInDiscord ?? false,
      isVisible: category.isVisible ?? true,
      guildId: category.guildId ?? '',
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  }

  /**
   * Erstellt eine neue Kategorie mit verbesserter Fehlerbehandlung
   */
  async createCategory(input: any): Promise<Category> {
    try {
      // Validiere Eingaben
      if (!input.name || input.name.trim().length === 0) {
        throw new BadRequestException('Category name is required');
      }
      
      if (!input.categoryType) {
        this.logger.warn('Category type not provided, using default');
        input.categoryType = 'default';
      }

      const category = await this.prisma.category.create({
        data: {
          guildId: input.guildId || process.env.GUILD_ID,
          name: input.name,
          categoryType: input.categoryType,
          isVisible: input.isVisible ?? true,
          isTrackingActive: input.isTrackingActive ?? false,
          isSendSetup: input.isSendSetup ?? false,
          allowedRoles: input.allowedRoles || [],
          discordCategoryId: input.discordCategoryId || undefined,
          isDeletedInDiscord: input.isDeletedInDiscord ?? false,
        },
      });
      
      return this.mapCategory(category);
    } catch (error) {
      // Verbesserte Fehlerbehandlung
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Eine Kategorie mit diesem Namen existiert bereits');
        }
      }
      
      this.logger.error('Error creating category:', error);
      throw error instanceof BadRequestException 
        ? error 
        : new InternalServerErrorException('Fehler beim Erstellen der Kategorie');
    }
  }

  /**
   * Ruft alle Kategorien ab mit verbesserter Fehlerbehandlung
   */
  async getCategories(): Promise<Category[]> {
    try {
      this.logger.log('Fetching categories...');
      const categories = await this.prisma.category.findMany();
      this.logger.log(`Categories fetched: ${categories.length}`);
      return categories.map(category => this.mapCategory(category));
    } catch (error) {
      this.logger.error('Error fetching categories:', error);
      throw new InternalServerErrorException('Fehler beim Abrufen der Kategorien');
    }
  }

  /**
   * Ruft eine einzelne Kategorie anhand ihrer ID ab
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id }
      });
      
      if (!category) {
        throw new NotFoundException(`Kategorie mit ID ${id} nicht gefunden`);
      }
      
      return this.mapCategory(category);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error fetching category ${id}:`, error);
      throw new InternalServerErrorException(`Fehler beim Abrufen der Kategorie ${id}`);
    }
  }

  /**
   * Aktualisiert eine Kategorie mit verbesserten Prüfungen und Fehlerbehandlung
   */
  async updateCategory(id: string, input: any): Promise<Category> {
    try {
      this.logger.log(`Updating category with id: ${id}`);
      
      // Prüfe ob die ID im Input mit der Anfrage-ID übereinstimmt
      if (input.id && id !== input.id) {
        throw new BadRequestException('ID-Konflikt: Parameter-ID stimmt nicht mit Body-ID überein');
      }
      
      // Prüfe ob die Kategorie existiert
      const existingCategory = await this.prisma.category.findUnique({
        where: { id }
      });
      
      if (!existingCategory) {
        throw new NotFoundException(`Kategorie mit ID ${id} nicht gefunden`);
      }
      
      // Aktualisiere die Kategorie in der Datenbank
      const updatedCategory = await this.prisma.$transaction(async (tx) => {
        return tx.category.update({
          where: { id },
          data: {
            guildId: input.guildId,
            name: input.name,
            categoryType: input.categoryType || existingCategory.categoryType,
            isVisible: input.isVisible ?? existingCategory.isVisible,
            isTrackingActive: input.isTrackingActive ?? existingCategory.isTrackingActive,
            isSendSetup: input.isSendSetup ?? existingCategory.isSendSetup,
            allowedRoles: input.allowedRoles ?? existingCategory.allowedRoles,
            discordCategoryId: input.discordCategoryId ?? existingCategory.discordCategoryId,
            isDeletedInDiscord: input.isDeletedInDiscord ?? existingCategory.isDeletedInDiscord,
            updatedAt: new Date()
          },
        });
      });
      
      
      // Wenn Name oder Sichtbarkeit geändert wurde, füge einen Job zur Queue hinzu
      if ((input.name !== undefined && input.name !== existingCategory.name) || 
          (input.isVisible !== undefined && input.isVisible !== existingCategory.isVisible)) {
        
        // Prüfen, ob die discordCategoryId vorhanden ist
        if (updatedCategory.discordCategoryId) {
          await this.queueService.addCategoryJob(
            JOB_TYPES.UPDATE_CATEGORY,
            {
              name: updatedCategory.name,
              guildId: updatedCategory.guildId,
              discordCategoryId: updatedCategory.discordCategoryId,
              isVisible: updatedCategory.isVisible
            },
            updatedCategory.id
          );
          
          this.logger.log(`Category update job added to queue for: ${updatedCategory.id}`);
        } else {
          this.logger.warn(`Cannot queue update for category ${updatedCategory.id}: No Discord category ID`);
        }
      }
      
      return this.mapCategory(updatedCategory);
    } catch (error) {
      // Spezifische Fehlerbehandlung
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Eine Kategorie mit diesem Namen existiert bereits');
        }
      }
      
      this.logger.error(`Error updating category ${id}:`, error);
      throw new InternalServerErrorException(`Fehler beim Aktualisieren der Kategorie ${id}`);
    }
  }

  /**
   * Löscht eine Kategorie mit verbesserter Fehlerbehandlung
   */
  async deleteCategory(id: string): Promise<Category> {
    try {
      this.logger.log(`Deleting category with id: ${id}`);
      
      // Prüfe in einer Transaktion auf verknüpfte Zones
      const { category, linkedZones } = await this.prisma.$transaction(async (tx) => {
        const zones = await tx.zone.findMany({
          where: { categoryId: id },
        });
        
        const categoryToDelete = await tx.category.findUnique({
          where: { id },
        });
        
        if (!categoryToDelete) {
          throw new NotFoundException(`Kategorie mit ID ${id} nicht gefunden`);
        }
        
        return { category: categoryToDelete, linkedZones: zones };
      });
      
      if (linkedZones.length > 0) {
        this.logger.error('Error: Zone still linked to category');
        throw new BadRequestException(
          'Es existiert noch eine Zone, die mit dieser Kategorie verknüpft ist. Bitte löschen Sie diese zuerst.',
        );
      }
      
      // Lösche die Kategorie in einer neuen Transaktion
      const deletedCategory = await this.prisma.$transaction(async (tx) => {
        return tx.category.delete({
          where: { id },
        });
      });
      
      // Mappe die Kategorie mit allen Feldern
      const mappedCategory = this.mapCategory(deletedCategory);
      
      return mappedCategory;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Error deleting category ${id}:`, error);
      throw new InternalServerErrorException(`Fehler beim Löschen der Kategorie ${id}`);
    }
  }
}