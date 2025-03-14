// apps/bot/src/hooks/categories/index.ts
import { Client } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';
import { setupCategoryCreateHandler } from './create.category';
import { setupCategoryUpdateHandler, processUpdateEvent } from './update.category';
import { handleCategoryDeleted, setupPendingDeleteHandler, categoryCacheMap } from './delete.category';

// Re-export wichtige Hilfsfunktionen und Typen für externe Verwendung
export { handleCategoryDeleted } from './delete.category';
export { fetchCompleteCategory, CategoryRow } from './helpers';
export { processUpdateEvent } from './update.category';

/**
 * Initialisiert den Kategorie-Cache mit existierenden Kategorien aus der Datenbank
 */
async function initializeCategoryCache() {
  try {
    logger.info('Initialisiere Kategorie-Cache...');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, guild_id, discord_category_id')
      .filter('discord_category_id', 'not.is', null);
      
    if (error) {
      logger.error('Fehler beim Laden der Kategorien für den Cache:', error);
      return;
    }
    
    if (categories && categories.length > 0) {
      for (const category of categories) {
        if (category.discord_category_id) {
          categoryCacheMap.set(category.id, {
            discordCategoryId: category.discord_category_id,
            name: category.name || 'Unbekannte Kategorie',
            guildId: category.guild_id
          });
        }
      }
      
      logger.info(`${categoryCacheMap.size} Kategorien in den Cache geladen`);
    } else {
      logger.info('Keine existierenden Kategorien mit Discord-IDs gefunden');
    }
  } catch (error) {
    logger.error('Unerwarteter Fehler beim Initialisieren des Kategorie-Caches:', error);
  }
}

/**
 * Hauptfunktion, die alle Event-Handler für Kategorien einrichtet
 * Diese Funktion ersetzt die ursprüngliche setupCategoryEventHandlers
 */
export function setupCategoryEventHandlers(discordClient: Client) {
  // Initialisiere den Cache
  initializeCategoryCache();
  
  // Direktes Abonnement für ALLE Events ohne Filter (DELETE, UPDATE, INSERT)
  const directChannel = supabase
    .channel('direct-categories-all')
    .on(
      'postgres_changes',
      {
        event: '*', // Alle Events abonnieren
        schema: 'public',
        table: 'categories'
      },
      (payload) => {
        console.log('[DIRECT] Kategorie-Event empfangen:', {
          eventType: payload.eventType,
          table: payload.table,
          schema: payload.schema,
          newData: payload.new,
          oldData: payload.old
        });
        
        // Detailliertere Informationen für UPDATE-Events
        if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
          console.log('[DIRECT] UPDATE-Details:', {
            id: payload.new.id,
            alter_name: payload.old.name,
            neuer_name: payload.new.name,
            alte_sichtbarkeit: payload.old.is_visible,
            neue_sichtbarkeit: payload.new.is_visible
          });
          
          // Direktes Aufrufen des Update-Handlers für dieses Event
          console.log('[DIRECT] Verarbeite UPDATE-Event direkt...');
          try {
            // Direktes Aufrufen der Verarbeitungslogik ohne den Subscription-Mechanismus
            processUpdateEvent(discordClient, payload);
          } catch (error) {
            console.error('[DIRECT] Fehler beim Verarbeiten des UPDATE-Events:', error);
          }
        }
        
        // Spezielle Behandlung für DELETE-Events
        if (payload.eventType === 'DELETE' && payload.old) {
          handleCategoryDeleted(discordClient, payload.old);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[DIRECT] Kanal 'direct-categories-all' Status: ${status}`);
    });

  // Abonniere INSERT-Events für Kategorien
  const unsubscribeFromInserts = setupCategoryCreateHandler(discordClient);
  logger.info('Kategorie-Erstellungs-Handler initialisiert');

  // Abonniere UPDATE-Events für Kategorien
  const unsubscribeFromUpdates = setupCategoryUpdateHandler(discordClient);
  logger.info('Kategorie-Aktualisierungs-Handler initialisiert');

  // Abonniere die discord_sync-Tabelle für Kategorie-Löschungen
  const discordSyncChannel = setupPendingDeleteHandler(discordClient)
    .subscribe((status) => {
      console.log(`[Discord Sync] Kanal 'discord-sync-delete' Status: ${status}`);
    });
  logger.info('Kategorie-Löschungs-Handler (pending_delete) initialisiert');

  // Rückgabe einer Cleanup-Funktion, um alle Abonnements zu beenden
  return () => {
    unsubscribeFromInserts();
    unsubscribeFromUpdates();
    // Cleanup für den direkten Kanal
    supabase.removeChannel(directChannel);
    // Cleanup für das discord_sync-Abonnement
    supabase.removeChannel(discordSyncChannel);
  };
}