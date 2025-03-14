// apps/bot/src/hooks/categories/helpers.ts
import { supabase } from 'pyro-types';
import { Database } from 'pyro-types/generated/supabase';
import { DiscordAPIError } from 'discord.js';
import logger from 'pyro-logger';

// Typdefinition für die Kategorietabelle
export type CategoryRow = Database['public']['Tables']['categories']['Row'];

// Maximale Anzahl Wiederholungsversuche bei Discord-API-Fehlern
export const MAX_RETRY_ATTEMPTS = 3;
// Basis-Wartezeit für exponentiellen Backoff (in ms)
export const BASE_RETRY_DELAY = 1000;

/**
 * Holt die vollständigen Kategoriedaten aus Supabase
 * Dies ist zentral für die Entscheidung, ob Updates oder Löschungen durchgeführt werden
 */
export async function fetchCompleteCategory(categoryId: string): Promise<CategoryRow | null> {
  console.log(`[CategoryHelpers] fetchCompleteCategory: Hole vollständige Daten für Kategorie ${categoryId}`);
  
  try {
    // Wir verwenden .maybeSingle() anstatt .single(), da wir Null-Ergebnisse ohne Fehler haben möchten
    console.log(`[CategoryHelpers] Starte Supabase-Anfrage für Kategorie ${categoryId}`);
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle();
    
    if (error) {
      console.error(`[CategoryHelpers] Fehler beim Abrufen der Kategorie ${categoryId}:`, error);
      logger.error(`Fehler beim Abrufen vollständiger Kategoriedetails: ${error.message}`);
      return null;
    }
    
    if (!data) {
      console.warn(`[CategoryHelpers] Keine Daten für Kategorie ${categoryId} gefunden, evt. bereits gelöscht`);
      return null;
    }
    
    console.log(`[CategoryHelpers] Kategorie ${categoryId} erfolgreich abgerufen:`, 
      JSON.stringify({
        id: data.id,
        name: data.name,
        guild_id: data.guild_id,
        category_type: data.category_type,
        discord_category_id: data.discord_category_id,
        allowed_roles: data.allowed_roles
      }, null, 2)
    );
    
    return data as CategoryRow;
  } catch (err) {
    console.error(`[CategoryHelpers] Unerwarteter Fehler beim Abrufen der Kategorie ${categoryId}:`, err);
    logger.error('Unerwarteter Fehler beim Abrufen der Kategoriedetails:', err);
    return null;
  }
}

/**
 * Aktualisiert den Sync-Status in Supabase
 */
export async function updateSyncStatus(
  categoryId: string, 
  guildId: string, 
  data: any,
  syncStatus: 'synced' | 'error' | 'deleted' | 'pending_delete'
) {
  console.log(`[CategoryHelpers] updateSyncStatus: Aktualisiere Sync-Status für Kategorie ${categoryId} auf "${syncStatus}"`);
  console.log(`[CategoryHelpers] Sync-Daten:`, JSON.stringify(data, null, 2));
  
  try {
    // Die created_at Spalte existiert nicht in der Datenbank, also entfernen wir sie
    const syncData = {
      id: categoryId,
      entity_type: 'category',
      guild_id: guildId,
      data,
      sync_status: syncStatus
      // Keine created_at mehr, da es nicht in der Tabellendefinition existiert
    };
    
    console.log(`[CategoryHelpers] Sende Sync-Daten an Supabase:`, JSON.stringify(syncData, null, 2));
    
    // Prüfe zuerst, ob bereits ein Eintrag existiert
    const { data: existingEntry } = await supabase
      .from('discord_sync')
      .select()
      .eq('id', categoryId)
      .eq('entity_type', 'category');
      
    let result;
    let error;
    
    if (existingEntry && existingEntry.length > 0) {
      // Update statt Insert
      console.log(`[CategoryHelpers] Aktualisiere existierenden Eintrag für ${categoryId}`);
      const response = await supabase
        .from('discord_sync')
        .update({
          data,
          sync_status: syncStatus,
          guild_id: guildId
        })
        .eq('id', categoryId)
        .eq('entity_type', 'category')
        .select();
        
      result = response.data;
      error = response.error;
    } else {
      // Neuer Eintrag
      console.log(`[CategoryHelpers] Erstelle neuen Eintrag für ${categoryId}`);
      const response = await supabase
        .from('discord_sync')
        .insert(syncData)
        .select();
        
      result = response.data;
      error = response.error;
    }
      
    if (error) {
      console.error(`[CategoryHelpers] Fehler beim Speichern des Sync-Status für Kategorie ${categoryId}:`, error);
      throw error;
    }
    
    console.log(`[CategoryHelpers] Sync-Status erfolgreich aktualisiert:`, result);
    
  } catch (error) {
    console.error(`[CategoryHelpers] Fehler beim Aktualisieren des Sync-Status für Kategorie ${categoryId}:`, error);
    logger.error(`Fehler beim Aktualisieren des Sync-Status für Kategorie ${categoryId}:`, error);
  }
}

/**
 * Fehlerbehandlung für Discord-API-Fehler
 */
export function handleDiscordError(error: any) {
  return error instanceof DiscordAPIError
    ? `Discord API Fehler: ${error.message} (Code: ${error.code})`
    : error instanceof Error
      ? error.message
      : 'Unbekannter Fehler';
}