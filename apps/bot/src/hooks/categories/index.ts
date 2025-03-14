// apps/bot/src/hooks/categories/index.ts
import { Client } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';
import { setupCategoryCreateHandler } from './create.category';
import { setupCategoryUpdateHandler } from './update.category';
import { handleCategoryDeleted, setupPendingDeleteHandler } from './delete.category';

// Re-export wichtige Hilfsfunktionen und Typen für externe Verwendung
export { handleCategoryDeleted } from './delete.category';
export { fetchCompleteCategory, CategoryRow } from './helpers';

/**
 * Hauptfunktion, die alle Event-Handler für Kategorien einrichtet
 * Diese Funktion ersetzt die ursprüngliche setupCategoryEventHandlers
 */
export function setupCategoryEventHandlers(discordClient: Client) {
  // Direktes Abonnement für DELETE-Events ohne Filter
  const directChannel = supabase
    .channel('direct-categories-all')
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
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