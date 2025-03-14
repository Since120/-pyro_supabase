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
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    
    if (error) {
      logger.error(`Fehler beim Abrufen vollständiger Kategoriedetails: ${error.message}`);
      return null;
    }
    
    return data as CategoryRow;
  } catch (err) {
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
  try {
    await supabase
      .from('discord_sync')
      .insert({
        id: categoryId,
        entity_type: 'category',
        guild_id: guildId,
        data,
        sync_status: syncStatus
      });
  } catch (error) {
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