// apps/bot/src/hooks/categories/delete.category.ts
import { Client } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';
import { fetchCompleteCategory, updateSyncStatus, handleDiscordError } from './helpers';

// Cache-Map für Kategorie-IDs (Supabase-ID -> Discord-ID)
// Diese wird von allen relevanten Event-Handlern verwendet
export const categoryCacheMap = new Map<string, { discordCategoryId: string, name: string, guildId: string }>();

/**
 * Behandelt direkte DELETE-Events für Kategorien
 */
export async function handleCategoryDeleted(discordClient: Client, deletedCategory: any) {
  if (!deletedCategory) {
    logger.error('Gelöschte Kategoriedaten fehlen');
    return;
  }

  const { 
    id: categoryId
  } = deletedCategory;

  // Zusätzliche Logging für Debugging
  logger.info(`DELETE-Event für Kategorie empfangen: ID=${categoryId}`);

  // Versuchen, die Discord-Kategorie-ID aus dem Cache zu holen
  const cachedCategory = categoryCacheMap.get(categoryId);
  
  if (cachedCategory) {
    logger.info(`Discord-Kategorie-ID aus Cache gefunden: ${cachedCategory.discordCategoryId}`);
    
    const { discordCategoryId, name, guildId } = cachedCategory;
    const effectiveName = name || 'Unbekannte Kategorie';
    
    try {
      // Versuche, die Guild zu finden
      const guild = await discordClient.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }

      // Hole die Discord-Kategorie
      const discordCategory = await guild.channels.fetch(discordCategoryId).catch(error => {
        // Spezifischere Fehlerbehandlung für nicht gefundene Kanäle
        if (error.code === 10003) { // UNKNOWN_CHANNEL
          logger.warn(`Discord-Kategorie mit ID ${discordCategoryId} bereits gelöscht oder nicht gefunden (Code: ${error.code})`);
          return null;
        }
        throw error; // Andere Fehler weiterwerfen
      });
      
      if (!discordCategory) {
        logger.warn(`Discord-Kategorie mit ID ${discordCategoryId} bereits gelöscht oder nicht gefunden`);
        
        // Trotzdem den Sync-Status aktualisieren, da die Kategorie nicht mehr existiert
        await updateSyncStatus(
          categoryId,
          guildId,
          { 
            discord_id: discordCategoryId, 
            message: 'Kategorie bereits gelöscht' 
          },
          'deleted'
        );
        
        // Aus dem Cache entfernen
        categoryCacheMap.delete(categoryId);
        return;
      }

      // Lösche die Discord-Kategorie
      await discordCategory.delete(`Kategorie "${effectiveName}" wurde in der Anwendung gelöscht`);

      logger.info(`Discord-Kategorie "${effectiveName}" erfolgreich gelöscht`);

      // Da der Datensatz bereits gelöscht ist, brauchen wir keinen Update mehr, 
      // aber wir protokollieren den erfolgreichen Löschvorgang in discord_sync
      await updateSyncStatus(
        categoryId,
        guildId,
        { discord_id: discordCategoryId },
        'deleted'
      );
      
      // Aus dem Cache entfernen
      categoryCacheMap.delete(categoryId);
    } catch (error) {
      logger.error(`Fehler beim Löschen der Discord-Kategorie ${discordCategoryId}:`, error);

      // Fehler dokumentieren
      await updateSyncStatus(
        categoryId,
        guildId,
        { 
          discord_id: discordCategoryId, 
          error_message: handleDiscordError(error) 
        },
        'error'
      );
    }
  } else {
    // Wenn wir die Discord-ID nicht im Cache haben, versuchen wir es direkt über die API
    logger.info(`Keine Cache-Informationen für Kategorie ${categoryId} gefunden, versuche Discord-ID zu ermitteln...`);
    
    try {
      // Query für die letzte Discord-Sync-Information für diese Kategorie
      const { data: syncData } = await supabase
        .from('discord_sync')
        .select('*')
        .eq('id', categoryId)
        .eq('entity_type', 'category')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (syncData && syncData.length > 0 && syncData[0].data) {
        const syncItem = syncData[0];
        const syncDataObj = syncItem.data as Record<string, any>;
        const guildId = syncItem.guild_id;
        
        // Sicherstellen, dass wir ein Objekt mit discord_id haben
        if (syncDataObj && typeof syncDataObj === 'object' && 'discord_id' in syncDataObj) {
          const discordCategoryId = syncDataObj.discord_id as string;
          const name = syncDataObj.name as string || 'Unbekannte Kategorie';
          
          logger.info(`Discord-ID aus Sync-Daten gefunden: ${discordCategoryId} für "${name}"`);
          
          // Führe das Löschen durch
          try {
            // Versuche, die Guild zu finden
            const guild = await discordClient.guilds.fetch(guildId);
            if (!guild) {
              throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
            }

            // Hole die Discord-Kategorie
            const discordCategory = await guild.channels.fetch(discordCategoryId).catch(error => {
              if (error.code === 10003) { // UNKNOWN_CHANNEL
                logger.warn(`Discord-Kategorie mit ID ${discordCategoryId} bereits gelöscht oder nicht gefunden (Code: ${error.code})`);
                return null;
              }
              throw error;
            });
            
            if (!discordCategory) {
              logger.warn(`Discord-Kategorie mit ID ${discordCategoryId} bereits gelöscht oder nicht gefunden`);
              await updateSyncStatus(categoryId, guildId, { 
                discord_id: discordCategoryId, 
                message: 'Kategorie bereits gelöscht' 
              }, 'deleted');
              return;
            }

            // Lösche die Discord-Kategorie
            await discordCategory.delete(`Kategorie "${name}" wurde in der Anwendung gelöscht`);
            logger.info(`Discord-Kategorie "${name}" erfolgreich gelöscht`);
            
            await updateSyncStatus(categoryId, guildId, { discord_id: discordCategoryId }, 'deleted');
          } catch (error) {
            logger.error(`Fehler beim Löschen der Discord-Kategorie ${discordCategoryId}:`, error);
            await updateSyncStatus(categoryId, guildId, { 
              discord_id: discordCategoryId, 
              error_message: handleDiscordError(error) 
            }, 'error');
          }
        } else {
          logger.warn(`Keine Discord-Kategorie-ID in den Sync-Daten gefunden, nichts zu löschen`);
        }
      } else {
        logger.warn(`Keine Sync-Daten für Kategorie ${categoryId} gefunden, nichts zu löschen`);
      }
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Sync-Daten für Kategorie ${categoryId}:`, error);
    }
  }
}

/**
 * Abonniert die discord_sync-Tabelle für Kategorie-Löschungen von pending_delete Events
 * Dies ist der Hauptweg, wie Kategorien gelöscht werden
 */
export function setupPendingDeleteHandler(discordClient: Client) {
  console.log(`[DeleteCategory] Richte Supabase-Listener für pending_delete Events ein`);
  
  return supabase
    .channel('discord-sync-delete')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'discord_sync',
        filter: `entity_type=eq.category AND sync_status=eq.pending_delete`
      },
      async (payload) => {
        console.log('[DeleteCategory] discord_sync Event empfangen:', JSON.stringify({
          event: payload.eventType,
          table: payload.table,
          schema: payload.schema,
          id: payload.new?.id || 'unbekannt',
          sync_status: payload.new?.sync_status || 'unbekannt'
        }, null, 2));
        
        if (!payload.new) {
          console.error('[DeleteCategory] Event enthält keine neuen Daten, breche ab');
          return;
        }
        
        const syncData = payload.new;
        const { id: categoryId, guild_id: guildId, data } = syncData;
        
        console.log(`[DeleteCategory] pending_delete Event für Kategorie ${categoryId} erhalten`);
        console.log(`[DeleteCategory] Sync-Daten:`, JSON.stringify(syncData, null, 2));
        
        // Zuerst die vollständigen Informationen abfragen
        logger.info(`Lösch-Event für Kategorie aus discord_sync empfangen: ID=${categoryId}`);
        logger.info(`Suche vollständige Informationen zu Kategorie ${categoryId} für die Löschung...`);
        
        // Versuche, die vollständigen Kategorie-Daten zu bekommen
        console.log(`[DeleteCategory] Suche vollständige Kategorie-Informationen in der Datenbank...`);
        const completeCategory = await fetchCompleteCategory(categoryId);
        
        let discordCategoryId = null;
        let categoryName = 'Unbekannte Kategorie';
        
        if (completeCategory) {
          // Wenn wir die vollständigen Daten haben, verwenden wir sie direkt
          discordCategoryId = completeCategory.discord_category_id;
          categoryName = completeCategory.name;
          
          console.log(`[DeleteCategory] Vollständige Kategorie-Daten gefunden:`, {
            name: categoryName,
            discord_id: discordCategoryId,
            category_type: completeCategory.category_type
          });
          
          logger.info(`Vollständige Kategorie-Informationen gefunden: "${categoryName}" mit Discord-ID ${discordCategoryId}`);
        } 
        // Fallback: wenn wir keine vollständigen Daten bekommen
        else if (data) {
          // Versuchen wir es trotzdem mit den Daten, die wir haben
          console.log(`[DeleteCategory] Keine Datenbank-Informationen gefunden, verwende Sync-Daten`);
          console.log(`[DeleteCategory] Verfügbare Sync-Daten:`, JSON.stringify(data, null, 2));
          
          categoryName = data.name || 'Unbekannte Kategorie';
          
          // Einfache, geradlinige Suche nach der Discord-ID
          discordCategoryId = data.discord_id || data.discord_category_id || null;
          
          if (discordCategoryId) {
            console.log(`[DeleteCategory] Discord ID aus Sync-Daten gefunden: ${discordCategoryId}`);
          } else {
            console.error(`[DeleteCategory] Keine Discord ID in Sync-Daten gefunden!`);
          }
          
          logger.info(`Kategorie-Informationen aus Sync-Daten: "${categoryName}" mit Discord-ID ${discordCategoryId}`);
        } else {
          console.error(`[DeleteCategory] Weder Kategorie noch Sync-Daten konnten gefunden werden!`);
        }
        
        if (!discordCategoryId) {
          console.error(`[DeleteCategory] Keine Discord-Kategorie-ID für ${categoryId} gefunden`);
          logger.error('Keine Discord-Kategorie-ID für die Löschung gefunden:', {
            categoryId,
            syncData
          });
          
          // Aktualisiere Status auf error
          console.log(`[DeleteCategory] Markiere Sync-Eintrag als fehlerhaft`);
          await supabase
            .from('discord_sync')
            .update({
              sync_status: 'error',
              data: { 
                ...data,
                error_message: 'Keine Discord-Kategorie-ID für die Löschung gefunden',
                error_timestamp: new Date().toISOString()
              }
            })
            .eq('id', categoryId)
            .eq('entity_type', 'category')
            .eq('sync_status', 'pending_delete');
            
          return;
        }
        
        logger.info(`Lösche Discord-Kategorie "${categoryName}" (ID: ${discordCategoryId})...`);
        
        try {
          // Versuche, die Guild zu finden
          const guild = await discordClient.guilds.fetch(guildId);
          if (!guild) {
            throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
          }

          // Direkte Debug-Ausgabe
          console.log(`Versuche Discord-Kategorie ${discordCategoryId} zu löschen`);

          // Hole die Discord-Kategorie mit besserer Fehlerbehandlung
          try {
            const discordCategory = await guild.channels.fetch(discordCategoryId);
            
            if (discordCategory) {
              // Lösche die Discord-Kategorie
              await discordCategory.delete(`Kategorie "${categoryName}" wurde in der Anwendung gelöscht`);
              console.log(`Discord-Kategorie "${categoryName}" erfolgreich gelöscht`);
              
              // Aktualisiere den Sync-Status
              await supabase
                .from('discord_sync')
                .update({
                  sync_status: 'deleted',
                  data: { 
                    ...data,
                    deleted_at: new Date().toISOString()
                  }
                })
                .eq('id', categoryId)
                .eq('entity_type', 'category')
                .eq('sync_status', 'pending_delete');
              
              return;
            }
          } catch (error: any) {
            console.error(`Fehler beim Abrufen des Kanals:`, error);
            
            // Prüfe, ob es sich um einen "Unbekannter Kanal"-Fehler handelt
            if (error.code === 10003) {
              console.log(`Kategorie ${discordCategoryId} existiert nicht mehr in Discord, markiere als gelöscht`);
              
              // Kategorie existiert nicht mehr, markiere als gelöscht
              await supabase
                .from('discord_sync')
                .update({
                  sync_status: 'deleted',
                  data: { 
                    ...data,
                    message: 'Kategorie bereits gelöscht',
                    deleted_at: new Date().toISOString()
                  }
                })
                .eq('id', categoryId)
                .eq('entity_type', 'category')
                .eq('sync_status', 'pending_delete');
              
              return;
            }
            
            // Bei anderen Fehlern werfen wir den Fehler weiter
            throw error;
          }
        } catch (error) {
          logger.error(`Fehler beim Löschen der Discord-Kategorie ${discordCategoryId}:`, error);

          // Fehler im Sync-Status vermerken
          await supabase
            .from('discord_sync')
            .update({
              sync_status: 'error',
              data: { 
                ...data,
                error_message: handleDiscordError(error)
              }
            })
            .eq('id', categoryId)
            .eq('entity_type', 'category')
            .eq('sync_status', 'pending_delete');
        }
      }
    );
}