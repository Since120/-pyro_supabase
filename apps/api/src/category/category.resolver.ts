// apps/api/src/category/category.resolver.ts
import { Resolver, Query, Mutation, Args, Subscription, ID } from '@nestjs/graphql';
import { BadRequestException, Logger } from '@nestjs/common';
import { CategoryService } from './category.service';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { QueueService } from '../queue/queue.service';
import { 
  Category, 
  CategoryEvent,
  MutationResult,
  CreateCategoryInput,
  UpdateCategoryInput
} from './models/category.model';

@Resolver(() => Category)
export class CategoryResolver {
  private readonly logger = new Logger(CategoryResolver.name);
  
  constructor(
    private readonly redisPubSubService: RedisPubSubService,
    private readonly categoryService: CategoryService,
    private readonly queueService: QueueService, // QueueService injizieren
  ) {}

  @Query(() => [Category], { 
    name: 'categories',
    description: 'Gibt alle Kategorien zurück' 
  })
  async getCategories(): Promise<Category[]> {
    this.logger.log('Fetching categories...');
    const categories = await this.categoryService.getCategories();
    this.logger.log(`Categories fetched: ${categories.length}`);
    return categories;
  }

  @Mutation(() => Category, { 
    name: 'createCategory',
    description: 'Erstellt eine neue Kategorie' 
  })
  async createCategory(
    @Args('input', { type: () => CreateCategoryInput }) input: CreateCategoryInput
  ): Promise<Category> {
    try {
      // Create the category in the database
      const category = await this.categoryService.createCategory(input);
      
      // Erstelle event payload mit allen erforderlichen Feldern
      const eventPayload: CategoryEvent = {
        id: category.id,
        guildId: category.guildId,
        name: category.name,
        discordCategoryId: category.discordCategoryId,
        timestamp: new Date().toISOString(),
        eventType: 'created'
      };
      
      // Direkt über Redis PubSub veröffentlichen, statt über Queue
      await this.redisPubSubService.publish('categoryEvent', eventPayload);
      
      return category;
    } catch (error) {
      this.logger.error(`Error creating category:`, error);
      throw error;
    }
  }

  @Mutation(() => MutationResult, { 
    name: 'categoryReceivedFromBot',
    description: 'Aktualisiert die Discord-Kategorie-ID' 
  })
  async categoryReceivedFromBot(
    @Args('id', { type: () => ID }) id: string,
    @Args('discordCategoryId', { type: () => String }) discordCategoryId: string
  ): Promise<MutationResult> {
    await this.categoryService.updateCategory(id, {
      id,
      discordCategoryId,
      // Andere Felder sind optional und werden nicht aktualisiert
    });
    return { success: true };
  }

  @Mutation(() => Category, { 
    name: 'updateCategory',
    description: 'Aktualisiert eine existierende Kategorie'
  })
  async updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateCategoryInput }) input: UpdateCategoryInput
  ): Promise<Category> {
    const updatedCategory = await this.categoryService.updateCategory(id, input);
    
    // Alle Event-Erstellungs- und Queue-Aufrufe wurden entfernt
    
    return updatedCategory;
  }
  
  @Mutation(() => Category, { 
    name: 'deleteCategory',
    description: 'Löscht eine Kategorie'
  })
  async deleteCategory(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Category> {
    const deletedCategory = await this.categoryService.deleteCategory(id);
    
    // Vollständiges Event-Payload erstellen
    const eventPayload: CategoryEvent = {
      id: deletedCategory.id,
      guildId: deletedCategory.guildId,
      name: deletedCategory.name,
      discordCategoryId: deletedCategory.discordCategoryId,
      timestamp: new Date().toISOString(),
      eventType: 'deleted'
    };
    
    // Direkt über Redis PubSub veröffentlichen
    await this.redisPubSubService.publish('categoryEvent', eventPayload);
    
    return deletedCategory;
  }

  @Subscription(() => CategoryEvent, {
    name: 'categoryEvent',
    description: 'Abonniere alle Kategorie-Events',
    // Rest der Subscription-Logik bleibt unverändert...
    filter: (payload, variables) => {
      // Zusätzliche Validierung des Payloads
      if (!payload || typeof payload !== 'object') {
        console.error('Invalid payload received in categoryEvent subscription:', payload);
        return false;
      }
      
      // Prüfe, ob alle Pflichtfelder vorhanden sind
      const requiredFields = ['id', 'guildId', 'name', 'eventType', 'timestamp'];
      const missingFields = requiredFields.filter(field => !payload[field]);
      
      if (missingFields.length > 0) {
        console.error(`Missing required fields in categoryEvent payload: ${missingFields.join(', ')}`, payload);
        return false;
      }
      
      // Wenn alles in Ordnung ist, erlaube das Event
      return true;
    },
    resolve: (payload) => {
      // Stelle sicher, dass payload nicht null ist
      if (!payload) {
        
        // Rückgabe eines Dummy-Events anstatt null
        // Dies vermeidet den non-nullable Fehler
        return {
          id: 'error',
          guildId: 'error',
          name: 'Error Event',
          timestamp: new Date().toISOString(),
          eventType: 'error',
          error: 'Null payload received'
        };
      }
      
      // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
      const safeCategoryEvent: CategoryEvent = {
        id: payload.id || 'unknown',
        guildId: payload.guildId || 'unknown',
        name: payload.name || 'Unknown Category',
        discordCategoryId: payload.discordCategoryId,
        timestamp: payload.timestamp || new Date().toISOString(),
        eventType: payload.eventType || 'unknown',
        error: payload.error,
        details: payload.details
      };
      
      return safeCategoryEvent;
    }
  })
  categoryEvent() {
    // Debug-Logging hinzufügen
    this.logger.log('New categoryEvent subscription established');
    return this.redisPubSubService.asyncIterator('categoryEvent');
  }
}