// apps/bot/src/utils/channelMapping.ts - Migriert zu Supabase
import logger from 'pyro-logger';
import { supabase } from 'pyro-types';

// In-Memory Cache für Channel-Mappings
const channelMappingCache = new Map<string, string>();

/**
 * Rebuilds the channel mapping from Supabase data
 * This ensures that the bot knows which voice channel belongs to which category
 */
export async function rebuildChannelMapping(): Promise<void> {
  try {
    // Hole alle Zonen mit Discord-Voice-IDs aus Supabase
    const { data: zones, error } = await supabase
      .from('zones')
      .select(`
        id,
        discord_voice_id,
        category_id,
        categories:category_id (
          discord_category_id
        )
      `)
      .not('discord_voice_id', 'is', null);
    
    if (error) {
      logger.error('Fehler beim Abrufen der Zonen aus Supabase:', error);
      return;
    }
    
    if (zones && zones.length > 0) {
      let mappingCount = 0;
      
      // Cache leeren
      channelMappingCache.clear();
      
      for (const zone of zones) {
        if (zone.discord_voice_id && zone.categories && zone.categories.discord_category_id) {
          // Speichere das Mapping im Cache
          channelMappingCache.set(zone.discord_voice_id, zone.categories.discord_category_id);
          mappingCount++;
        }
      }
      
      logger.info(`Channel-Mapping erfolgreich neu aufgebaut. ${mappingCount} Channels gemappt.`);
    } else {
      logger.warn('Keine Zonen gefunden, Channel-Mapping nicht aktualisiert.');
    }
  } catch (error) {
    logger.error('Fehler beim Neuaufbau des Channel-Mappings:', error);
  }
}

/**
 * Gets the channel mapping from the cache or Supabase
 * @param discordVoiceId Discord voice channel ID
 * @returns Discord category ID or null if not found
 */
export async function getChannelMapping(discordVoiceId: string): Promise<string | null> {
  // Zuerst im Cache nachschauen
  if (channelMappingCache.has(discordVoiceId)) {
    return channelMappingCache.get(discordVoiceId) || null;
  }
  
  try {
    // Wenn nicht im Cache, in Supabase nachschauen
    const { data, error } = await supabase
      .from('zones')
      .select(`
        categories:category_id (
          discord_category_id
        )
      `)
      .eq('discord_voice_id', discordVoiceId)
      .single();
    
    if (error || !data || !data.categories || !data.categories.discord_category_id) {
      return null;
    }
    
    const discordCategoryId = data.categories.discord_category_id;
    
    // Im Cache speichern
    channelMappingCache.set(discordVoiceId, discordCategoryId);
    
    return discordCategoryId;
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Channel-Mappings für ${discordVoiceId}:`, error);
    return null;
  }
}

/**
 * Sets the channel mapping in the cache
 * @param discordVoiceId Discord voice channel ID
 * @param discordCategoryId Discord category ID
 */
export async function setChannelMapping(discordVoiceId: string, discordCategoryId: string): Promise<void> {
  // Im Cache speichern
  channelMappingCache.set(discordVoiceId, discordCategoryId);
  
  logger.debug(`Channel-Mapping gesetzt: ${discordVoiceId} -> ${discordCategoryId}`);
  
  // Kein Aktualisieren von Supabase nötig, da die Zone bereits bei der Erstellung/Aktualisierung
  // mit der richtigen Kategorie-ID verknüpft wird
}