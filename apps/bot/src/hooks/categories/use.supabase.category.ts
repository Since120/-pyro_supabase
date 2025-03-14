// apps/bot/src/hooks/categories/use.supabase.category.ts
import { supabase, realtimeManager } from 'pyro-types';
import { Client, ChannelType, DiscordAPIError, GuildChannelManager } from 'discord.js';
import logger from 'pyro-logger';

// Maximale Anzahl Wiederholungsversuche bei Discord-API-Fehlern
const MAX_RETRY_ATTEMPTS = 3;
// Basis-Wartezeit für exponentiellen Backoff (in ms)
const BASE_RETRY_DELAY = 1000;

/**
 * Behandelt die Erstellung von Kategorien in Discord
 * Ersetzt die vorherige Redis-PubSub-Implementierung mit Supabase Realtime
 */
export function setupCategoryEventHandlers(discordClient: Client) {
  // Direktes Abonnement für alle Kategorie-Events ohne Filter
  // Dies sollte sicherstellen, dass wir alle Events erhalten, unabhängig von der Guild-ID
  const directChannel = supabase
    .channel('direct-categories-all')
    .on(
      'postgres_changes',
      {
        event: '*',
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

  // Abonniere INSERT-Events für Kategorien (über den Realtime-Manager)
  const unsubscribeFromInserts = realtimeManager.subscribeToCategories(process.env.GUILD_ID || '*', async (payload) => {
    // Debug-Ausgabe für alle empfangenen Ereignisse
    console.log('Kategorie-Event empfangen:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      newData: payload.new,
      oldData: payload.old
    });
    
    // Nur INSERT-Events (neue Kategorien) verarbeiten
    if (payload.eventType !== 'INSERT') {
      return;
    }

    const newCategory = payload.new;
    if (!newCategory) {
      logger.error('Kategoriedaten fehlen in Payload:', payload);
      return;
    }

    const { id: categoryId, name, guild_id: guildId, discord_category_id: discordCategoryId } = newCategory;

    // Eingabevalidierung für alle erforderlichen Felder
    if (!guildId || !name || !categoryId) {
      logger.error('Fehlende Pflichtfelder:', { categoryId, guildId, name });

      // Update category record with error
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId, // Verwende categoryId als ID
          entity_type: 'category',
          guild_id: guildId || '',
          data: { error_message: 'Fehlende Pflichtfelder (categoryId, guildId oder name)' },
          sync_status: 'error'
        });

      return;
    }

    // Wenn Kategorie bereits in Discord existiert, nichts weiter tun
    if (discordCategoryId) {
      logger.info('Kategorie existiert bereits in Discord:', discordCategoryId);

      // Update sync status to confirm it's synced
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { discord_id: discordCategoryId },
          sync_status: 'synced'
        });

      return;
    }

    logger.info(`Erstelle neue Discord-Kategorie "${name}" für Guild ${guildId}...`);

    try {
      // Versuche, die Guild zu finden
      const guild = await discordClient.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }

      // Implementiere exponentiellen Backoff für Discord-API-Aufrufe
      let retryAttempt = 0;
      let discordCategory;
      let lastError;

      while (retryAttempt < MAX_RETRY_ATTEMPTS) {
        try {
          // Erstelle die Kategorie in Discord
          discordCategory = await guild.channels.create({
            name,
            type: ChannelType.GuildCategory
          });
          
          // Wenn erfolgreich, breche die Retry-Schleife ab
          break;
        } catch (error) {
          lastError = error;
          retryAttempt++;

          // Wenn wir die maximale Anzahl an Versuchen erreicht haben, wirf den Fehler
          if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
            throw error;
          }

          // Berechne Verzögerung mit exponentiellem Backoff
          const delayMs = BASE_RETRY_DELAY * Math.pow(2, retryAttempt);
          logger.warn(`Fehler bei Discord API Aufruf, Versuch ${retryAttempt}/${MAX_RETRY_ATTEMPTS}, warte ${delayMs}ms...`, error);

          // Warte, bevor wir es erneut versuchen
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      if (!discordCategory) {
        throw new Error('Kategorie konnte nicht erstellt werden (unbekannter Fehler)');
      }

      logger.info(`Discord-Kategorie erstellt: ${discordCategory.name} (${discordCategory.id})`);

      // Aktualisiere die Kategorie in der Datenbank mit der Discord Category ID
      const { error: updateError } = await supabase
        .from('categories')
        .update({ discord_category_id: discordCategory.id })
        .eq('id', categoryId);

      if (updateError) {
        throw updateError;
      }

      // Aktualisiere den Sync-Status
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { discord_id: discordCategory.id },
          sync_status: 'synced'
        });

      logger.info(`Kategorie "${name}" wurde erfolgreich in Discord erstellt und in der Datenbank aktualisiert.`);
    } catch (error) {
      logger.error('Fehler beim Erstellen der Discord-Kategorie:', error);

      // Spezielle Behandlung für bekannte Discord API Fehler
      const errorMessage = error instanceof DiscordAPIError
        ? `Discord API Fehler: ${error.message} (Code: ${error.code})`
        : error instanceof Error
          ? error.message
          : 'Unbekannter Fehler';

      // Fehler in discord_sync Tabelle eintragen
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { error_message: errorMessage },
          sync_status: 'error'
        });
    }
  });

  // Abonniere UPDATE-Events für Kategorien
  const unsubscribeFromUpdates = realtimeManager.subscribeToCategories(process.env.GUILD_ID || '*', async (payload) => {
    // Debug-Ausgabe für alle empfangenen Ereignisse
    console.log('Kategorie-Event empfangen:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      newData: payload.new,
      oldData: payload.old
    });
    
    // Nur UPDATE-Events verarbeiten
    if (payload.eventType !== 'UPDATE') {
      return;
    }

    const updatedCategory = payload.new;
    const oldCategory = payload.old;
    
    if (!updatedCategory) {
      logger.error('Kategoriedaten fehlen in Payload:', payload);
      return;
    }

    const { 
      id: categoryId, 
      name: newName, 
      guild_id: guildId, 
      discord_category_id: discordCategoryId,
      is_visible: isVisible,
      allowed_roles: allowedRoles 
    } = updatedCategory;

    // Wenn keine Discord-Kategorie-ID vorhanden ist, können wir nichts aktualisieren
    if (!discordCategoryId) {
      logger.warn(`Kategorie ${categoryId} hat keine Discord-Kategorie-ID, Überspringe Update`);
      return;
    }

    // Das Problem ist, dass oldCategory oft nur die ID enthält und keine anderen Eigenschaften
    // Daher müssen wir prüfen, ob wir überhaupt sinnvolle Vergleiche anstellen können
    console.log('oldCategory Vollständigkeit prüfen:', {
      hatName: !!oldCategory?.name,
      hatVisibility: 'is_visible' in oldCategory,
      hatRoles: !!oldCategory?.allowed_roles
    });

    // Wenn oldCategory unvollständig ist, müssen wir annehmen, dass eine Änderung stattgefunden hat
    // und die Aktualisierung in Discord durchführen
    const forceUpdate = !oldCategory || Object.keys(oldCategory).length <= 1;

    // Prüfe, ob sich relevante Eigenschaften geändert haben
    const nameChanged = forceUpdate || newName !== oldCategory.name;
    const visibilityChanged = forceUpdate || isVisible !== oldCategory.is_visible;
    const rolesChanged = forceUpdate || 
      !oldCategory.allowed_roles || 
      JSON.stringify(allowedRoles) !== JSON.stringify(oldCategory.allowed_roles);
    
    // Debug für Änderungserkennung
    console.log('Änderungserkennung:', {
      forceUpdate,
      nameChanged,
      visibilityChanged,
      rolesChanged,
      name: newName,
      oldName: oldCategory?.name
    });
    
    // Nur fortfahren, wenn es Änderungen gibt, die Discord betreffen
    if (!nameChanged && !visibilityChanged && !rolesChanged) {
      logger.info(`Kein relevanter Unterschied für Discord-Update bei Kategorie ${categoryId}`);
      return;
    }

    logger.info(`Aktualisiere Discord-Kategorie für ${categoryId}:`);
    if (nameChanged) logger.info(`- Name: "${oldCategory?.name}" -> "${newName}"`);
    if (visibilityChanged) logger.info(`- Sichtbarkeit: ${oldCategory?.is_visible} -> ${isVisible}`);
    if (rolesChanged) logger.info(`- Rollen geändert`);

    try {
      // Versuche, die Guild zu finden
      const guild = await discordClient.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }

      // Hole die Discord-Kategorie - mit direktem Debug
      console.log(`Versuche Kanal mit ID ${discordCategoryId} zu finden...`);
      const discordCategory = await guild.channels.fetch(discordCategoryId);
      
      if (!discordCategory) {
        throw new Error(`Discord-Kategorie mit ID ${discordCategoryId} nicht gefunden`);
      }
      
      // Direktes Logging des Kanal-Objekts
      console.log('Gefundener Kanal Typ:', discordCategory.type);
      console.log('ChannelType.GuildCategory:', ChannelType.GuildCategory);
      console.log('Ist es eine Kategorie?', discordCategory.type === ChannelType.GuildCategory);
      console.log('Kanal-Methoden:', Object.keys(discordCategory));
      
      // Prüfen des Discord-Kanal-Typs
      if (discordCategory.type !== ChannelType.GuildCategory) {
        throw new Error(`Kanal mit ID ${discordCategoryId} ist keine Kategorie, sondern vom Typ ${discordCategory.type}`);
      }

      // Als Kategorie-Kanal behandeln mit try/catch für jeden Schritt
      if (nameChanged) {
        try {
          console.log(`Führe jetzt die Umbenennung durch von "${oldCategory?.name || 'unbekannt'}" zu "${newName}"`);
          // Versuch mit der niedrigsten API-Ebene
          await discordCategory.edit({ name: newName })
            .then(updatedChannel => {
              console.log('Umbenennung erfolgreich:', updatedChannel.name);
            })
            .catch(err => {
              console.error('Discord API Fehler bei Umbenennung:', err);
              throw err;
            });
        } catch (err) {
          console.error('Schwerwiegender Fehler bei der Umbenennung:', err);
          throw err;
        }
      }

      // Aktualisiere die Sichtbarkeit der Discord-Kategorie
      if (visibilityChanged) {
        try {
          if (!isVisible) {
            // Kategorie unsichtbar machen für @everyone
            await discordCategory.permissionOverwrites.edit(guildId, { ViewChannel: false });
            logger.info(`Discord-Kategorie auf unsichtbar gesetzt`);
          } else {
            // Wenn sichtbar, entferne die Einschränkung für @everyone
            const hasOverwrite = discordCategory.permissionOverwrites.cache.has(guildId);
            if (hasOverwrite) {
              await discordCategory.permissionOverwrites.delete(guildId);
            }
            logger.info(`Discord-Kategorie auf sichtbar gesetzt`);
          }
        } catch (err) {
          logger.error(`Fehler beim Ändern der Sichtbarkeit:`, err);
        }
      }

      // Aktualisiere die Rollen-Berechtigungen der Discord-Kategorie
      if (rolesChanged && Array.isArray(allowedRoles)) {
        try {
          // Lösche zuerst alle bestehenden Rollen-Overrides
          const existingOverwrites = discordCategory.permissionOverwrites.cache;
          for (const [id, overwrite] of existingOverwrites.entries()) {
            if (id !== guildId && overwrite.type === 0) { // 0 = role type
              await discordCategory.permissionOverwrites.delete(id);
            }
          }
          
          // Füge die neuen Rollen-Berechtigungen hinzu
          for (const roleId of allowedRoles) {
            if (typeof roleId === 'string') {
              try {
                await discordCategory.permissionOverwrites.edit(roleId, { ViewChannel: true });
                logger.info(`Rollenberechtigungen für ${roleId} aktualisiert`);
              } catch (err) {
                logger.error(`Fehler beim Setzen der Berechtigungen für Rolle ${roleId}:`, err);
              }
            }
          }
          logger.info(`Rollenberechtigungen aktualisiert`);
        } catch (err) {
          logger.error(`Fehler beim Aktualisieren der Rollenberechtigungen:`, err);
        }
      }

      // Erfolgsmeldung, wenn wir bis hierher gekommen sind
      console.log(`Discord-Kategorie wurde erfolgreich aktualisiert.`);
      logger.info(`Discord-Kategorie erfolgreich aktualisiert`);

      // Aktualisiere den Sync-Status
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { 
            discord_id: discordCategoryId,
            updated_at: new Date().toISOString()
          },
          sync_status: 'synced'
        });
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Discord-Kategorie ${discordCategoryId}:`, error);

      // Spezielle Behandlung für bekannte Discord API Fehler
      const errorMessage = error instanceof DiscordAPIError
        ? `Discord API Fehler: ${error.message} (Code: ${error.code})`
        : error instanceof Error
          ? error.message
          : 'Unbekannter Fehler';

      // Fehler in discord_sync Tabelle eintragen
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { 
            discord_id: discordCategoryId, 
            error_message: errorMessage 
          },
          sync_status: 'error'
        });
    }
  });

  // Abonniere die discord_sync-Tabelle für Kategorie-Löschungen
  const discordSyncChannel = supabase
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
        // Debug-Ausgabe für alle empfangenen Ereignisse
        console.log('Discord Sync Event empfangen:', {
          eventType: payload.eventType,
          table: payload.table,
          schema: payload.schema,
          newData: payload.new,
          oldData: payload.old
        });
        
        if (!payload.new) {
          return;
        }
        
        const syncData = payload.new;
        const { id: categoryId, guild_id: guildId, data } = syncData;
        
        // Verbesserte Logging für Debugging
        console.log(`Empfangene Daten aus discord_sync:`, JSON.stringify(syncData, null, 2));
        
        // Prüfe, ob die notwendigen Daten vorhanden sind und extrahiere die Discord-ID korrekt
        let discordCategoryId;
        let categoryName;
        
        // Versuche die Discord-ID aus verschiedenen möglichen Stellen zu extrahieren
        if (data) {
          categoryName = data.name;
          
          // Versuche mögliche Quellen für die Discord-ID in der richtigen Reihenfolge
          if (data.discord_id) {
            discordCategoryId = data.discord_id;
            console.log(`Discord-ID aus data.discord_id gefunden: ${discordCategoryId}`);
          } 
          // Versuche aus data.discord_category_id (alternative Stelle)
          else if (data.discord_category_id) {
            discordCategoryId = data.discord_category_id;
            console.log(`Discord-ID aus data.discord_category_id gefunden: ${discordCategoryId}`);
          }
          // Versuche aus data.category_data.discord_category_id
          else if (data.category_data && data.category_data.discord_category_id) {
            discordCategoryId = data.category_data.discord_category_id;
            console.log(`Discord-ID aus data.category_data.discord_category_id gefunden: ${discordCategoryId}`);
          }
          // Versuche direkt auf der obersten Ebene der Daten
          else if (syncData.discord_category_id) {
            discordCategoryId = syncData.discord_category_id;
            console.log(`Discord-ID aus syncData.discord_category_id gefunden: ${discordCategoryId}`);
          }
          
          console.log(`Extrahierte Daten: Name=${categoryName}, Discord-ID=${discordCategoryId}`);
        }
        
        if (!categoryName || !discordCategoryId) {
          logger.error('Unvollständige Daten für Kategorie-Löschung. Name oder Discord-ID fehlt:', {
            categoryId,
            categoryName,
            discordCategoryId,
            data
          });
          return;
        }
        
        logger.info(`Lösch-Event für Kategorie aus discord_sync empfangen: ID=${categoryId}, Name=${categoryName}, Discord-ID=${discordCategoryId}`);
        
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
            
            // Noch mehr Debug-Infos
            console.log(`Discord-Kategorie gefunden:`, {
              id: discordCategory?.id,
              name: discordCategory?.name,
              type: discordCategory?.type
            });
            
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

          // Spezielle Behandlung für bekannte Discord API Fehler
          const errorMessage = error instanceof DiscordAPIError
            ? `Discord API Fehler: ${error.message} (Code: ${error.code})`
            : error instanceof Error
              ? error.message
              : 'Unbekannter Fehler';

          // Fehler im Sync-Status vermerken
          await supabase
            .from('discord_sync')
            .update({
              sync_status: 'error',
              data: { 
                ...data,
                error_message: errorMessage 
              }
            })
            .eq('id', categoryId)
            .eq('entity_type', 'category')
            .eq('sync_status', 'pending_delete');
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Discord Sync] Kanal 'discord-sync-delete' Status: ${status}`);
    });

  // Separate Funktion zur Behandlung von gelöschten Kategorien
  async function handleCategoryDeleted(discordClient: Client, deletedCategory: any) {
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

    // Wenn keine Discord-Kategorie-ID vorhanden ist, müssen wir nichts tun
    if (!discordCategoryId) {
      logger.warn(`Kategorie ${categoryId} hatte keine Discord-Kategorie-ID, nichts zu löschen`);
      return;
    }

    logger.info(`Lösche Discord-Kategorie "${name}" (ID: ${discordCategoryId})...`);

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
        await supabase
          .from('discord_sync')
          .insert({
            id: categoryId,
            entity_type: 'category',
            guild_id: guildId,
            data: { discord_id: discordCategoryId, message: 'Kategorie bereits gelöscht' },
            sync_status: 'deleted'
          });
        
        return;
      }

      // Lösche die Discord-Kategorie
      await discordCategory.delete(`Kategorie "${name}" wurde in der Anwendung gelöscht`);

      logger.info(`Discord-Kategorie "${name}" erfolgreich gelöscht`);

      // Da der Datensatz bereits gelöscht ist, brauchen wir keinen Update mehr, 
      // aber wir protokollieren den erfolgreichen Löschvorgang in discord_sync
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { discord_id: discordCategoryId },
          sync_status: 'deleted'
        });
    } catch (error) {
      logger.error(`Fehler beim Löschen der Discord-Kategorie ${discordCategoryId}:`, error);

      // Spezielle Behandlung für bekannte Discord API Fehler
      const errorMessage = error instanceof DiscordAPIError
        ? `Discord API Fehler: ${error.message} (Code: ${error.code})`
        : error instanceof Error
          ? error.message
          : 'Unbekannter Fehler';

      // Fehler in discord_sync Tabelle eintragen
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { 
            discord_id: discordCategoryId, 
            error_message: errorMessage 
          },
          sync_status: 'error'
        });
    }
  }

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
