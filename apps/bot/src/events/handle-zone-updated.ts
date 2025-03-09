// apps/bot/src/events/handle-zone-updated.ts - Migriert zu Supabase
import { Client, VoiceChannel } from 'discord.js';
import { supabase } from 'pyro-types';
import { getChannelMapping, setChannelMapping } from '../utils/channelMapping';
import logger from 'pyro-logger';

/**
 * Überwacht Supabase-Events für aktualisierte Zonen und aktualisiert entsprechende Discord-Voice-Channels
 */
export function handleZoneUpdated(discordClient: Client) {
  // Supabase Realtime Subscription für Zonen-Updates
  const channel = supabase
    .channel('zones-updated')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'zones'
    }, async (payload) => {
      try {
        // Zone-Daten aus dem Payload extrahieren
        const zone = payload.new;
        const oldZone = payload.old;
        
        logger.info('Zone aktualisiert:', zone);
        
        const zoneId = zone.id;
        const name = zone.name;
        const discordVoiceId = zone.discord_voice_id;
        
        // Wenn keine Discord Voice ID vorhanden ist, können wir nichts aktualisieren
        if (!discordVoiceId) {
          logger.warn(`Kein discord_voice_id in der aktualisierten Zone ${zoneId} vorhanden.`);
          return;
        }
        
        // Wenn sich der Name nicht geändert hat, müssen wir nichts tun
        if (name === oldZone.name) {
          logger.info(`Keine Namensänderung für Zone ${zoneId} - überspringe Update`);
          return;
        }
        
        // Verwenden der vorhandenen Mappings, um die Kategorie zu identifizieren
        const discordCategoryId = await getChannelMapping(discordVoiceId);
        
        // Wenn wir eine discordCategoryId haben, bestätigen wir das Mapping
        if (discordCategoryId) {
          logger.info(`Vorhandenes Mapping gefunden: ${discordVoiceId} -> ${discordCategoryId}`);
        } else {
          logger.warn(`Kein Mapping für Voice-Channel ${discordVoiceId} gefunden.`);
          
          // Automatisches Beheben: Kategorie-ID aus der Datenbank holen
          const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('discord_category_id')
            .eq('id', zone.category_id)
            .single();
            
          if (categoryError || !category?.discord_category_id) {
            logger.error(`Keine Kategorie gefunden für Zone ${zoneId} mit Kategorie-ID ${zone.category_id}`);
          } else {
            // Mapping speichern
            await setChannelMapping(discordVoiceId, category.discord_category_id);
            logger.info(`Neues Mapping gesetzt: ${discordVoiceId} -> ${category.discord_category_id}`);
          }
        }
        
        try {
          // Discord-Channel abrufen
          const channel = await discordClient.channels.fetch(discordVoiceId);
          
          if (!channel) {
            logger.warn(`Channel mit ID ${discordVoiceId} nicht gefunden.`);
            
            // Aktualisiere Status in discord_sync
            await supabase
              .from('discord_sync')
              .upsert({
                id: zoneId,
                entity_type: 'zone',
                guild_id: zone.guild_id || 'unknown',
                data: { error_message: 'Discord-Channel nicht gefunden' },
                sync_status: 'error',
                last_synced_at: new Date().toISOString()
              });
              
            return;
          }
          
          if (channel instanceof VoiceChannel) {
            logger.info(`Voice-Channel gefunden: ${channel.name}`);
            
            // Umbenennen des Voice-Channel-Namens
            if (name !== channel.name) {
              await channel.setName(name);
              logger.info(`Voice-Channel ${channel.name} wurde auf ${name} umbenannt.`);
            }

            // Überprüfen ob der Channel in der richtigen Kategorie ist
            const expectedCategoryId = await getChannelMapping(discordVoiceId);
            if (expectedCategoryId && channel.parentId !== expectedCategoryId) {
              logger.info(`Channel ${channel.name} wurde manuell verschoben. Verschiebe zurück in die korrekte Kategorie.`);
              
              try {
                // TypeScript-sicheres Zurückverschieben
                const categoryId = expectedCategoryId as string;
                await channel.setParent(categoryId);
                logger.info(`Channel ${channel.name} wurde wieder in die korrekte Kategorie verschoben.`);
              } catch (err) {
                logger.error(`Fehler beim Zurückverschieben des Channels ${channel.name}:`, err);
              }
            }
            
            // Aktualisiere Status in discord_sync
            await supabase
              .from('discord_sync')
              .upsert({
                id: zoneId,
                entity_type: 'zone',
                guild_id: zone.guild_id || 'unknown',
                data: { 
                  discord_voice_id: discordVoiceId,
                  name: channel.name
                },
                sync_status: 'synced',
                last_synced_at: new Date().toISOString()
              });
          }
        } catch (err) {
          logger.error(`Fehler beim Aktualisieren des Voice Channels für Zone ${zoneId}:`, err);
          
          // Fehler in discord_sync dokumentieren
          await supabase
            .from('discord_sync')
            .upsert({
              id: zoneId,
              entity_type: 'zone',
              guild_id: zone.guild_id || 'unknown',
              data: { 
                error_message: err instanceof Error ? err.message : 'Unbekannter Fehler',
                discord_voice_id: discordVoiceId
              },
              sync_status: 'error',
              last_synced_at: new Date().toISOString()
            });
        }
      } catch (error) {
        logger.error('Unerwarteter Fehler bei der Verarbeitung eines Zone-Updates:', error);
      }
    })
    .subscribe();
    
  logger.info('Supabase Realtime subscription für Zone-Updates erstellt');
  
  // Cleanup-Funktion zurückgeben
  return () => {
    supabase.removeChannel(channel);
  };
}