// apps/bot/src/events/handle-zone-created.ts - Migriert zu Supabase
import { Client, ChannelType } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';
import { setChannelMapping } from '../utils/channelMapping';

/**
 * Überwacht Supabase-Events für neu erstellte Zonen und erstellt entsprechende Discord-Voice-Channels
 */
export function handleZoneCreated(discordClient: Client) {
  // Supabase Realtime Subscription für Zone-Einfügungen
  const channel = supabase
    .channel('zones-created')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'zones'
    }, async (payload) => {
      try {
        // Zone-Daten aus dem Payload extrahieren
        const zone = payload.new;
        logger.info('Neue Zone erkannt:', zone);
        
        const zoneId = zone.id;
        const name = zone.name;
        const categoryId = zone.category_id;
        
        if (!categoryId) {
          logger.error(`Keine Kategorie-ID für Zone ${zoneId} gefunden`);
          
          // Fehler in Supabase speichern
          await updateZoneError(zoneId, 'Keine Kategorie-ID in der Zone gefunden');
          return;
        }
        
        // Hole die zugehörige Kategorie aus Supabase, um die Discord-Kategorie-ID zu bekommen
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('discord_category_id, guild_id')
          .eq('id', categoryId)
          .single();
        
        if (categoryError || !category) {
          logger.error(`Fehler beim Abrufen der Kategorie ${categoryId}:`, categoryError);
          await updateZoneError(zoneId, `Kategorie nicht gefunden: ${categoryError?.message || 'Unbekannter Fehler'}`);
          return;
        }
        
        const discordCategoryId = category.discord_category_id;
        const guildId = category.guild_id;
        
        if (!discordCategoryId) {
          logger.error(`Keine Discord-Kategorie-ID für Kategorie ${categoryId} gefunden`);
          
          // Fallback zur Umgebungsvariable
          const fallbackCategoryId = process.env.DEFAULT_DISCORD_CATEGORY_ID;
          if (!fallbackCategoryId) {
            logger.error('Auch keine Fallback-Discord-Kategorie-ID gefunden');
            await updateZoneError(zoneId, 'Keine Discord-Kategorie-ID gefunden und kein Fallback konfiguriert');
            return;
          }
          
          logger.warn(`Verwende Fallback-Discord-Kategorie-ID aus Umgebungsvariable: ${fallbackCategoryId}`);
        }
        
        if (!guildId) {
          logger.error(`Keine Guild-ID für Kategorie ${categoryId} gefunden`);
          await updateZoneError(zoneId, 'Keine Guild-ID in der Kategorie gefunden');
          return;
        }
        
        // Sicherstellen, dass wir eine gültige Discord-Kategorie-ID haben
        if (!discordCategoryId && !process.env.DEFAULT_DISCORD_CATEGORY_ID) {
          logger.error('Keine Discord-Kategorie-ID und kein Default-Wert verfügbar');
          await updateZoneError(zoneId, 'Keine gültige Discord-Kategorie-ID verfügbar');
          return;
        }
        
        const effectiveDiscordCategoryId = discordCategoryId || process.env.DEFAULT_DISCORD_CATEGORY_ID as string;
        
        logger.info(`Erstelle Discord-Channel für Zone "${name}" in Kategorie ${effectiveDiscordCategoryId} (Guild: ${guildId})`);
        
        try {
          // Discord-Guild abrufen
          const guild = await discordClient.guilds.fetch(guildId);
          
          // Voice-Channel erstellen
          const voiceChannel = await guild.channels.create({
            name: name || 'Neue Zone',
            type: ChannelType.GuildVoice,
            parent: effectiveDiscordCategoryId,
            reason: `Supabase Zone erstellt: ${zoneId}`
          });
          
          logger.info(`Discord Voice-Channel erstellt: ${voiceChannel.name} (${voiceChannel.id})`);
          
          // Channel-Zuordnung speichern (mit garantiert string-Typ)
          await setChannelMapping(voiceChannel.id, effectiveDiscordCategoryId);
          logger.info(`Channel-Zuordnung gesetzt: ${voiceChannel.id} -> ${effectiveDiscordCategoryId}`);
          
          // Zone in Supabase mit der Discord Voice-ID aktualisieren
          const { error: updateError } = await supabase
            .from('zones')
            .update({ 
              discord_voice_id: voiceChannel.id 
            })
            .eq('id', zoneId);
          
          if (updateError) {
            logger.error(`Fehler beim Aktualisieren der Zone ${zoneId} mit Discord Voice-ID:`, updateError);
            return;
          }
          
          // Erfolg in discord_sync dokumentieren
          await supabase
            .from('discord_sync')
            .insert({
              id: zoneId,
              entity_type: 'zone',
              guild_id: guildId,
              data: { 
                discord_voice_id: voiceChannel.id,
                name: voiceChannel.name
              },
              sync_status: 'synced'
            });
          
          logger.info(`Zone ${zoneId} in Supabase erfolgreich mit Discord Voice-ID ${voiceChannel.id} aktualisiert`);
          
        } catch (error) {
          logger.error(`Fehler beim Erstellen des Discord-Channels für Zone ${zoneId}:`, error);
          
          // Fehler in Supabase dokumentieren
          const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
          await updateZoneError(zoneId, `Fehler beim Erstellen des Discord-Channels: ${errorMessage}`);
        }
        
      } catch (error) {
        logger.error('Unerwarteter Fehler bei der Verarbeitung einer neuen Zone:', error);
      }
    })
    .subscribe();
    
  logger.info('Supabase Realtime subscription für Zonen erstellt');
  
  // Hilfsfunktion zum Aktualisieren des Fehlerstatus einer Zone
  async function updateZoneError(zoneId: string, errorMessage: string) {
    try {
      // Fehler in discord_sync Tabelle eintragen
      await supabase
        .from('discord_sync')
        .insert({
          id: zoneId,
          entity_type: 'zone',
          guild_id: 'unknown', // Fallback, wird später aktualisiert
          data: { error_message: errorMessage },
          sync_status: 'error'
        });
        
      logger.info(`Fehlerstatus für Zone ${zoneId} in Supabase aktualisiert`);
    } catch (err) {
      logger.error(`Fehler beim Aktualisieren des Fehlerstatus für Zone ${zoneId}:`, err);
    }
  }
  
  // Cleanup-Funktion zurückgeben, die beim Beenden aufgerufen werden kann
  return () => {
    supabase.removeChannel(channel);
  };
}