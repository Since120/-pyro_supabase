// apps/bot/src/hooks/categories/delete.category.ts
import { Client } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';
import { fetchCompleteCategory, updateSyncStatus, handleDiscordError } from './helpers';

/**
 * Behandelt direkte DELETE-Events für Kategorien
 */
export async function handleCategoryDeleted(discordClient: Client, deletedCategory: any) {
  if (!deletedCategory) {
    logger.error('Gelöschte Kategoriedaten fehlen');
    return;
  }

  const { 
    id: categoryId, 
    name, 
    guild_id: guildId, 
    discord_category_id: discordCategoryId 
  } = deletedCategory;

  // Zusätzliche Logging für Debugging
  logger.info(`DELETE-Event für Kategorie empfangen: ID=${categoryId}, Name=${name}, Discord-ID=${discordCategoryId}`);

  // Wenn keine Discord-Kategorie-ID vorhanden ist, versuchen wir sie direkt zu finden
  let effectiveDiscordCategoryId = discordCategoryId;
  let effectiveName = name || 'Unbekannte Kategorie';
  
  if (!effectiveDiscordCategoryId) {
    logger.warn(`Kategorie ${categoryId} hatte keine Discord-Kategorie-ID, versuche sie direkt zu finden...`);
    
    // Hole vollständige Kategorie-Informationen (vor dem vollständigen Löschen)
    const completeCategory = await fetchCompleteCategory(categoryId);
    
    if (completeCategory && completeCategory.discord_category_id) {
      effectiveDiscordCategoryId = completeCategory.discord_category_id;
      effectiveName = completeCategory.name;
      logger.info(`Discord-ID direkt gefunden: ${effectiveDiscordCategoryId} für "${effectiveName}"`);
    } else {
      logger.warn(`Keine Discord-Kategorie-ID gefunden, nichts zu löschen`);
      return;
    }
  }

  logger.info(`Lösche Discord-Kategorie "${effectiveName}" (ID: ${effectiveDiscordCategoryId})...`);

  try {
    // Versuche, die Guild zu finden
    const guild = await discordClient.guilds.fetch(guildId);
    if (!guild) {
      throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
    }

    // Hole die Discord-Kategorie
    const discordCategory = await guild.channels.fetch(effectiveDiscordCategoryId).catch(error => {
      // Spezifischere Fehlerbehandlung für nicht gefundene Kanäle
      if (error.code === 10003) { // UNKNOWN_CHANNEL
        logger.warn(`Discord-Kategorie mit ID ${effectiveDiscordCategoryId} bereits gelöscht oder nicht gefunden (Code: ${error.code})`);
        return null;
      }
      throw error; // Andere Fehler weiterwerfen
    });
    
    if (!discordCategory) {
      logger.warn(`Discord-Kategorie mit ID ${effectiveDiscordCategoryId} bereits gelöscht oder nicht gefunden`);
      
      // Trotzdem den Sync-Status aktualisieren, da die Kategorie nicht mehr existiert
      await updateSyncStatus(
        categoryId,
        guildId,
        { 
          discord_id: effectiveDiscordCategoryId, 
          message: 'Kategorie bereits gelöscht' 
        },
        'deleted'
      );
      
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
      { discord_id: effectiveDiscordCategoryId },
      'deleted'
    );
  } catch (error) {
    logger.error(`Fehler beim Löschen der Discord-Kategorie ${effectiveDiscordCategoryId}:`, error);

    // Fehler dokumentieren
    await updateSyncStatus(
      categoryId,
      guildId,
      { 
        discord_id: effectiveDiscordCategoryId, 
        error_message: handleDiscordError(error) 
      },
      'error'
    );
  }
}

/**
 * Abonniert die discord_sync-Tabelle für Kategorie-Löschungen von pending_delete Events
 */
export function setupPendingDeleteHandler(discordClient: Client) {
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
        if (!payload.new) {
          return;
        }
        
        const syncData = payload.new;
        const { id: categoryId, guild_id: guildId, data } = syncData;
        
        // Zuerst die vollständigen Informationen abfragen
        logger.info(`Lösch-Event für Kategorie aus discord_sync empfangen: ID=${categoryId}`);
        logger.info(`Suche vollständige Informationen zu Kategorie ${categoryId} für die Löschung...`);
        
        // Versuche, die vollständigen Kategorie-Daten zu bekommen
        const completeCategory = await fetchCompleteCategory(categoryId);
        
        let discordCategoryId = null;
        let categoryName = 'Unbekannte Kategorie';
        
        if (completeCategory) {
          // Wenn wir die vollständigen Daten haben, verwenden wir sie direkt
          discordCategoryId = completeCategory.discord_category_id;
          categoryName = completeCategory.name;
          
          logger.info(`Vollständige Kategorie-Informationen gefunden: "${categoryName}" mit Discord-ID ${discordCategoryId}`);
        } 
        // Fallback: wenn wir keine vollständigen Daten bekommen
        else if (data) {
          // Versuchen wir es trotzdem mit den Daten, die wir haben
          categoryName = data.name || 'Unbekannte Kategorie';
          
          // Einfache, geradlinige Suche nach der Discord-ID
          discordCategoryId = data.discord_id || data.discord_category_id || null;
          
          logger.info(`Kategorie-Informationen aus Sync-Daten: "${categoryName}" mit Discord-ID ${discordCategoryId}`);
        }
        
        if (!discordCategoryId) {
          logger.error('Keine Discord-Kategorie-ID für die Löschung gefunden:', {
            categoryId,
            syncData
          });
          
          // Aktualisiere Status auf error
          await supabase
            .from('discord_sync')
            .update({
              sync_status: 'error',
              data: { 
                ...data,
                error_message: 'Keine Discord-Kategorie-ID für die Löschung gefunden'
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