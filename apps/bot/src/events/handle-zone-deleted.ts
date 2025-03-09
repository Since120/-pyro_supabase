// apps/bot/src/events/handle-zone-deleted.ts - Migriert zu Supabase
import { Client, VoiceChannel } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';

/**
 * Überwacht Supabase-Events für gelöschte Zonen und löscht entsprechende Discord-Voice-Channels
 */
export function handleZoneDeleted(discordClient: Client) {
  // Supabase Realtime Subscription für Zonen-Löschungen
  const channel = supabase
    .channel('zones-deleted')
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'zones'
    }, async (payload) => {
      try {
        // Zone-Daten aus dem Payload extrahieren (bei DELETE ist nur old verfügbar)
        const deletedZone = payload.old;
        
        logger.info('Zone gelöscht:', deletedZone);
        
        const zoneId = deletedZone.id;
        const discordVoiceId = deletedZone.discord_voice_id;
        
        // Wenn keine Discord Voice ID vorhanden ist, können wir nichts löschen
        if (!discordVoiceId) {
          logger.warn(`Kein discord_voice_id in der gelöschten Zone ${zoneId} vorhanden.`);
          return;
        }
        
        try {
          // Discord-Channel abrufen
          const channel = await discordClient.channels.fetch(discordVoiceId);
          
          if (!channel) {
            logger.warn(`Channel mit ID ${discordVoiceId} nicht gefunden.`);
            
            // Status trotzdem aktualisieren
            await supabase
              .from('discord_sync')
              .upsert({
                id: zoneId,
                entity_type: 'zone',
                guild_id: deletedZone.guild_id || 'unknown',
                data: { 
                  info_message: 'Discord-Channel bereits nicht mehr vorhanden',
                  discord_voice_id: discordVoiceId
                },
                sync_status: 'deleted',
                last_synced_at: new Date().toISOString()
              });
              
            return;
          }
          
          if (channel instanceof VoiceChannel) {
            logger.info(`Voice-Channel gefunden: ${channel.name}`);
            
            const channelName = channel.name;
            
            // Voice-Channel löschen
            await channel.delete(`Zone ${zoneId} gelöscht`);
            logger.info(`Discord-Voice-Channel gelöscht: ${channelName}`);
            
            // Status aktualisieren in discord_sync
            await supabase
              .from('discord_sync')
              .upsert({
                id: zoneId,
                entity_type: 'zone',
                guild_id: deletedZone.guild_id || 'unknown',
                data: { 
                  deleted_channel_name: channelName,
                  discord_voice_id: discordVoiceId
                },
                sync_status: 'deleted',
                last_synced_at: new Date().toISOString()
              });
          }
        } catch (err) {
          logger.error(`Fehler beim Löschen des Voice Channels für Zone ${zoneId}:`, err);
          
          // Fehler in discord_sync dokumentieren
          await supabase
            .from('discord_sync')
            .upsert({
              id: zoneId,
              entity_type: 'zone',
              guild_id: deletedZone.guild_id || 'unknown',
              data: { 
                error_message: err instanceof Error ? err.message : 'Unbekannter Fehler',
                discord_voice_id: discordVoiceId
              },
              sync_status: 'error',
              last_synced_at: new Date().toISOString()
            });
        }
      } catch (error) {
        logger.error('Unerwarteter Fehler bei der Verarbeitung einer gelöschten Zone:', error);
      }
    })
    .subscribe();
    
  logger.info('Supabase Realtime subscription für Zone-Löschungen erstellt');
  
  // Cleanup-Funktion zurückgeben
  return () => {
    supabase.removeChannel(channel);
  };
}