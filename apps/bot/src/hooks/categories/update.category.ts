// apps/bot/src/hooks/categories/update.category.ts
import { Client, ChannelType } from 'discord.js';
import { supabase, realtimeManager } from 'pyro-types';
import logger from 'pyro-logger';
import { fetchCompleteCategory, updateSyncStatus, handleDiscordError, CategoryRow } from './helpers';
import { categoryCacheMap, handleCategoryDeleted } from './delete.category';

/**
 * Hilfsfunktion: Vergleicht zwei Objekte und gibt die Unterschiede zurück
 */
function compareObjects(oldObj: any, newObj: any): Record<string, { old: any, new: any }> {
  const changes: Record<string, { old: any, new: any }> = {};
  
  // Finde alle Eigenschaften, die sich geändert haben
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    // Behandle Objekte in den settings-Feldern besonders
    if (key === 'settings' && 
        typeof oldObj[key] === 'object' && oldObj[key] !== null &&
        typeof newObj[key] === 'object' && newObj[key] !== null) {
      
      const settingsChanges = compareObjects(oldObj[key], newObj[key]);
      
      if (Object.keys(settingsChanges).length > 0) {
        changes['settings'] = {
          changed_fields: Object.keys(settingsChanges),
          details: settingsChanges
        } as any;
      }
      continue;
    }
    
    // Normale Felder vergleichen
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changes[key] = {
        old: oldObj[key],
        new: newObj[key]
      };
    }
  }
  
  return changes;
}

/**
 * Verarbeitet die Task-Queue mit Rate-Limit-Verwaltung in Supabase
 * Diese Funktion ruft einfach die Supabase-Funktionen auf
 */
async function processTaskQueue(discordClient: Client): Promise<void> {
  try {
    // Verwende fetch direkt mit der Funktion um TypeScript zu umgehen
    // @ts-ignore - Wir müssen den TypeScript-Check deaktivieren
    const result = await (supabase.rpc as any)('get_next_category_task');
    const { data, error } = result;
    
    if (error) {
      logger.error('Fehler beim Abrufen des nächsten Tasks:', error);
      return;
    }
    
    // Nichts zu tun wenn kein Task oder im Rate-Limit
    if (!data || data.status === 'none' || data.status === 'rate_limited') {
      if (data && data.status === 'rate_limited') {
        logger.info(`Rate-Limit erreicht: ${data.message || 'Unbekannt'}, Retry in ${data.retry_after || '?'} Sekunden`);
      }
      return;
    }
    
    // 2. Wenn wir einen Task haben, verarbeiten wir ihn
    if (data.status === 'processing' && data.task_id && data.payload) {
      const taskId = data.task_id;
      const payload = data.payload;
      
      try {
        // Bereite den Payload für die Update-Funktion vor
        const categoryId = payload.category_id;
        
        // Hole die vollständigen Kategoriedaten
        const completeCategory = await fetchCompleteCategory(categoryId);
        
        if (!completeCategory) {
          logger.error(`Kategorie ${categoryId} nicht gefunden`);
          // @ts-ignore - Wir müssen den TypeScript-Check deaktivieren
          await (supabase.rpc as any)('complete_category_task', { 
            p_task_id: taskId, 
            p_success: false, 
            p_error_message: 'Kategorie nicht gefunden'
          });
          return;
        }
        
        // Verarbeite das Update (verwende die bestehende Funktion)
        await processUpdateEvent(discordClient, {
          eventType: 'UPDATE',
          new: completeCategory,
          old: {} // Wir haben keine alten Daten, aber die Funktion erwartet dieses Feld
        });
        
        // 3. Task als erfolgreich markieren
        // @ts-ignore - Wir müssen den TypeScript-Check deaktivieren
        await (supabase.rpc as any)('complete_category_task', { 
          p_task_id: taskId, 
          p_success: true 
        });
        
        logger.info(`Task ${taskId} für Kategorie ${categoryId} erfolgreich verarbeitet`);
      } catch (error) {
        logger.error(`Fehler bei der Verarbeitung von Task ${taskId}:`, error);
        
        // Task als fehlgeschlagen markieren
        // @ts-ignore - Wir müssen den TypeScript-Check deaktivieren
        await (supabase.rpc as any)('complete_category_task', { 
          p_task_id: taskId, 
          p_success: false, 
          p_error_message: handleDiscordError(error)
        });
      }
    }
  } catch (error) {
    logger.error('Fehler bei der Task-Queue-Verarbeitung:', error);
  }
}

/**
 * Verarbeitet ein Kategorie-Update-Event
 * Diese Funktion kann sowohl vom Realtime-Subscription als auch direkt aufgerufen werden.
 */
export async function processUpdateEvent(discordClient: Client, payload: any) {
  // Erweitertes Logging für jedes eingehende Event mit mehr Details
  console.log('[UpdateCategory] Verarbeite Kategorie-Event:', 
    JSON.stringify({
      eventType: payload.eventType,
      table: payload.table,
      id: payload.new ? (payload.new as any).id : (payload.old ? (payload.old as any).id : 'unbekannt'),
      name: payload.new ? (payload.new as any).name : (payload.old ? (payload.old as any).name : 'unbekannt'),
      category_type: payload.new ? (payload.new as any).category_type : (payload.old ? (payload.old as any).category_type : 'unbekannt'),
      is_visible: payload.new ? (payload.new as any).is_visible : (payload.old ? (payload.old as any).is_visible : 'unbekannt'),
      is_tracking_active: payload.new ? (payload.new as any).is_tracking_active : (payload.old ? (payload.old as any).is_tracking_active : 'unbekannt'),
      is_send_setup: payload.new ? (payload.new as any).is_send_setup : (payload.old ? (payload.old as any).is_send_setup : 'unbekannt'),
      is_deleted_in_discord: payload.new ? (payload.new as any).is_deleted_in_discord : (payload.old ? (payload.old as any).is_deleted_in_discord : 'unbekannt')
    }, null, 2)
  );
  
  // Detaillierter Event-Inhalt (nur für Debug-Zwecke)
  console.log('[UpdateCategory] Vollständiger Payload:', JSON.stringify(payload, null, 2));
  
  logger.info(`Kategorie-Event empfangen: ${payload.eventType} für ID ${payload.new?.id || 'unbekannt'}`);
  
  // Nur UPDATE-Events verarbeiten
  if (payload.eventType !== 'UPDATE') {
    console.log(`[UpdateCategory] Ignoriere Nicht-UPDATE Event: ${payload.eventType}`);
    logger.info(`Ignoriere Nicht-UPDATE Event: ${payload.eventType}`);
    return;
  }
  
  console.log(`[UpdateCategory] Verarbeite UPDATE-Event für Kategorie ID: ${payload.new?.id}`);
  
  // Zusätzliche Prüfung, ob es tatsächlich Änderungen gibt
  if (payload.new && payload.old) {
    const changes = compareObjects(payload.old, payload.new);
    console.log(`[UpdateCategory] Änderungen erkannt:`, changes);
    
    // Spezialfall: Löschmarkierung prüfen - direkt aus der Spalte oder aus settings
    let isDeleted = false;
    
    // Direkter Zugriff auf die Spalte
    if (payload.new.is_deleted_in_discord === true) {
      isDeleted = true;
    } 
    // Oder aus den settings, falls vorhanden
    else if (payload.new.settings && 
             typeof payload.new.settings === 'object' && 
             !Array.isArray(payload.new.settings)) {
      const settingsObj = payload.new.settings as Record<string, any>;
      if (settingsObj.is_deleted_in_discord === true) {
        isDeleted = true;
      }
    }
    
    if (isDeleted) {
      console.log(`[UpdateCategory] Kategorie ${payload.new.id} wurde als gelöscht markiert, leite Löschung ein...`);
      
      try {
        // Wir behandeln dies wie ein DELETE-Event
        await handleCategoryDeleted(discordClient, payload.new);
        return; // Wir stoppen hier, weil wir die Kategorie als gelöscht behandelt haben
      } catch (error) {
        console.error(`[UpdateCategory] Fehler beim Behandeln der als gelöscht markierten Kategorie:`, error);
        logger.error(`Fehler beim Löschen der als gelöscht markierten Kategorie ${payload.new.id}:`, error);
      }
    }
  }

  const updatedCategory = payload.new as CategoryRow;
  const oldCategory = payload.old as Partial<CategoryRow>;
  
  if (!updatedCategory) {
    logger.error('Kategoriedaten fehlen in Payload:', payload);
    return;
  }

  // Debug-Informationen über die empfangenen Kategoriedaten
  console.log(`[UpdateCategory] Empfangene Kategoriedaten: 
    ID: ${updatedCategory.id}
    Name: ${updatedCategory.name} (Alt: ${oldCategory?.name})
    Sichtbar: ${updatedCategory.is_visible} (Alt: ${oldCategory?.is_visible})
    Discord-Kategorie-ID: ${updatedCategory.discord_category_id}
  `);

  const { 
    id: categoryId, 
    name: newName, 
    guild_id: guildId, 
    discord_category_id: discordCategoryId
  } = updatedCategory;

  logger.info(`Verarbeite Kategorie-Update für ID: ${categoryId}, Name: ${newName}, Discord-ID: ${discordCategoryId}`);

  // Extrahieren der is_* Felder mit Typ-Sicherheit
  const isVisible = updatedCategory.is_visible ?? true;
  const allowedRoles = updatedCategory.allowed_roles || [];

  // Wenn keine Discord-Kategorie-ID vorhanden ist, können wir nichts aktualisieren
  if (!discordCategoryId) {
    logger.warn(`Kategorie ${categoryId} hat keine Discord-Kategorie-ID, Überspringe Update`);
    return;
  }

  // Die Kategorie in den Cache aufnehmen, damit sie auch beim Löschen verfügbar ist
  categoryCacheMap.set(categoryId, {
    discordCategoryId,
    name: newName,
    guildId
  });
  logger.info(`Kategorie ${categoryId} in Cache aufgenommen: ${discordCategoryId} (${newName})`);

  // Bei unvollständigen Daten: Hole die kompletten Informationen
  if (!oldCategory || Object.keys(oldCategory).length <= 1) {
    logger.info('Unvollständige Kategorie-Informationen erkannt, hole vollständige Daten...');
    
    // Vollständige Kategorie-Informationen aus der Datenbank holen
    const completeCategory = await fetchCompleteCategory(categoryId);
    
    if (completeCategory) {
      // Wenn wir vollständige Daten haben, setzen wir sie als Basis für den Vergleich
      logger.info(`Vollständige Kategorie-Informationen erhalten für ${categoryId}`);
      
      // Versuche die Discord-Kategorie zu finden
      try {
        // Versuche, die Guild zu finden
        logger.info(`Versuche Guild mit ID ${guildId} zu finden...`);
        const guild = await discordClient.guilds.fetch(guildId);
        if (!guild) {
          throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
        }
        
        // Hole die Discord-Kategorie
        logger.info(`Versuche Kanal mit ID ${discordCategoryId} zu finden...`);
        const discordCategory = await guild.channels.fetch(discordCategoryId);
        
        if (!discordCategory) {
          throw new Error(`Discord-Kategorie mit ID ${discordCategoryId} nicht gefunden`);
        }
        
        // Prüfe, ob sich der Name in Discord von der Datenbank unterscheidet
        logger.info(`Discord-Name: "${discordCategory.name}", DB-Name: "${newName}"`);
        const nameChangedInDiscord = discordCategory.name !== newName;
        const visibilityChanged = isVisible !== completeCategory.is_visible;
        const rolesChanged = JSON.stringify(allowedRoles) !== JSON.stringify(completeCategory.allowed_roles);
        
        logger.info('Änderungserkennung mit Discord-Daten:', {
          nameChangedInDiscord,
          visibilityChanged,
          rolesChanged,
          discordName: discordCategory.name,
          newName,
          oldName: completeCategory.name
        });
        
        // Wenn KEINE Änderungen entdeckt wurden, können wir hier abbrechen
        if (!nameChangedInDiscord && !visibilityChanged && !rolesChanged) {
          logger.info(`Keine relevanten Änderungen für Kategorie ${categoryId} erkannt`);
          return;
        }
        
        // Andernfalls verarbeiten wir nur die tatsächlichen Änderungen
        // Das reduziert unnötige Discord-API-Aufrufe
        if (nameChangedInDiscord) {
          logger.info(`Name geändert für Discord: "${discordCategory.name}" -> "${newName}"`);
        }
        if (visibilityChanged) {
          logger.info(`Sichtbarkeit geändert: ${completeCategory.is_visible} -> ${isVisible}`);
        }
        if (rolesChanged) {
          logger.info(`Rollen geändert`);
        }
      } catch (error) {
        // Wenn wir die Discord-Kategorie nicht finden können, aktualisieren wir trotzdem
        logger.warn(`Konnte Discord-Kategorie nicht abrufen, führe Update durch:`, error);
      }
    } else {
      // Wenn wir keine vollständigen Daten bekommen, nehmen wir einfach an, dass sich etwas geändert hat
      logger.info(`Konnte keine vollständigen Kategoriedaten abrufen, führe Update durch`);
    }
  } else {
    // Normale Vergleiche, wenn oldCategory vollständig ist
    try {
      // Versuche, die Guild zu finden
      logger.info(`Versuche Guild mit ID ${guildId} zu finden...`);
      const guild = await discordClient.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }
      
      // Hole die Discord-Kategorie
      logger.info(`Versuche Kanal mit ID ${discordCategoryId} zu finden...`);
      const discordCategory = await guild.channels.fetch(discordCategoryId);
      
      if (!discordCategory) {
        throw new Error(`Discord-Kategorie mit ID ${discordCategoryId} nicht gefunden`);
      }
      
      // Vergleiche aktuellen Discord-Namen mit dem neuen Namen
      const nameChangedInDiscord = discordCategory.name !== newName;
      const visibilityChanged = isVisible !== oldCategory.is_visible;
      const rolesChanged = JSON.stringify(allowedRoles) !== JSON.stringify(oldCategory.allowed_roles);
      
      logger.info('Änderungserkennung mit Discord und direkten Daten:', {
        nameChangedInDiscord,
        visibilityChanged,
        rolesChanged,
        discordName: discordCategory.name,
        newName,
        oldName: oldCategory.name
      });
      
      if (!nameChangedInDiscord && !visibilityChanged && !rolesChanged) {
        logger.info(`Kein relevanter Unterschied für Discord-Update bei Kategorie ${categoryId}`);
        return;
      }
      
      if (nameChangedInDiscord) logger.info(`Name geändert für Discord: "${discordCategory.name}" -> "${newName}"`);
      if (visibilityChanged) logger.info(`Sichtbarkeit geändert: ${oldCategory.is_visible} -> ${isVisible}`);
      if (rolesChanged) logger.info(`Rollen geändert`);
    } catch (error) {
      // Wenn wir die Discord-Kategorie nicht finden können, aktualisieren wir trotzdem
      logger.warn(`Konnte Discord-Kategorie nicht abrufen, führe Update durch:`, error);
      
      // Fallback auf normale Vergleiche ohne Discord-Daten
      const nameChanged = newName !== oldCategory.name;
      const visibilityChanged = isVisible !== oldCategory.is_visible;
      const rolesChanged = JSON.stringify(allowedRoles) !== JSON.stringify(oldCategory.allowed_roles);
      
      logger.info('Fallback-Änderungserkennung mit direkten Daten:', {
        nameChanged,
        visibilityChanged,
        rolesChanged,
        newName,
        oldName: oldCategory.name
      });
      
      // Wenn keine Änderungen entdeckt wurden, können wir hier abbrechen
      if (!nameChanged && !visibilityChanged && !rolesChanged) {
        logger.info(`Kein relevanter Unterschied für Discord-Update bei Kategorie ${categoryId}`);
        return;
      }
    }
  }

  try {
    // Versuche, die Guild zu finden
    logger.info(`Versuche Guild mit ID ${guildId} zu finden...`);
    const guild = await discordClient.guilds.fetch(guildId);
    if (!guild) {
      throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
    }
    logger.info(`Guild gefunden: ${guild.name}`);

    // Hole die Discord-Kategorie
    logger.info(`Versuche Kanal mit ID ${discordCategoryId} zu finden...`);
    const discordCategory = await guild.channels.fetch(discordCategoryId);
    
    if (!discordCategory) {
      throw new Error(`Discord-Kategorie mit ID ${discordCategoryId} nicht gefunden`);
    }
    logger.info(`Discord-Kategorie gefunden: ${discordCategory.name}`);
    
    // Prüfen des Discord-Kanal-Typs
    if (discordCategory.type !== ChannelType.GuildCategory) {
      throw new Error(`Kanal mit ID ${discordCategoryId} ist keine Kategorie, sondern vom Typ ${discordCategory.type}`);
    }

    // Name ändern, wenn nötig
    try {
      logger.info(`Führe Umbenennung zu "${newName}" durch`);
      await discordCategory.edit({ name: newName });
      logger.info('Umbenennung erfolgreich');
    } catch (err) {
      logger.error('Fehler bei der Umbenennung:', err);
      throw err;
    }

    // Prüfe, woher wir die Visibility-Einstellung bekommen
    // Versuche direkt die Spalte is_visible, wenn sie vorhanden ist
    const visibilityFromColumn = updatedCategory.is_visible;
    
    // Behandlung von settings als JSON-Objekt mit Typ-Sicherheit
    let visibilityFromSettings: boolean | undefined = undefined;
    if (updatedCategory.settings && 
        typeof updatedCategory.settings === 'object' && 
        !Array.isArray(updatedCategory.settings)) {
      // Type-Cast für TypeScript
      const settingsObj = updatedCategory.settings as Record<string, any>;
      visibilityFromSettings = settingsObj.is_visible;
    }
    
    // Debug-Ausgabe zum Verständnis der Datenstruktur
    logger.info(`Sichtbarkeit Quellen:`, {
      direkt_spalte: visibilityFromColumn, 
      settings: visibilityFromSettings
    });
    
    // Wähle die richtige Visibility-Einstellung
    const effectiveVisibility = visibilityFromColumn !== undefined 
      ? visibilityFromColumn 
      : (visibilityFromSettings !== undefined ? visibilityFromSettings : true);
    
    logger.info(`Effektive Sichtbarkeit für Discord: ${effectiveVisibility}`);

    // Sichtbarkeit ändern, wenn nötig
    try {
      if (!effectiveVisibility) {
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

    // Hole die erlaubten Rollen - entweder direkt oder aus den Settings
    let effectiveAllowedRoles: string[] = [];
    
    // Prüfe auf direkte Spalte
    if (Array.isArray(updatedCategory.allowed_roles)) {
      effectiveAllowedRoles = updatedCategory.allowed_roles;
      logger.info(`Verwende allowed_roles direkt aus Spalte: ${effectiveAllowedRoles.length} Rollen`);
    } 
    // Alternativ aus den Settings
    else if (updatedCategory.settings && 
             typeof updatedCategory.settings === 'object' && 
             !Array.isArray(updatedCategory.settings)) {
      const settingsObj = updatedCategory.settings as Record<string, any>;
      if (Array.isArray(settingsObj.allowed_roles)) {
        effectiveAllowedRoles = settingsObj.allowed_roles;
        logger.info(`Verwende allowed_roles aus Settings: ${effectiveAllowedRoles.length} Rollen`);
      }
    }
    
    // Rollen-Berechtigungen aktualisieren, wenn nötig
    if (effectiveAllowedRoles.length > 0) {
      try {
        // Lösche zuerst alle bestehenden Rollen-Overrides
        const existingOverwrites = discordCategory.permissionOverwrites.cache;
        for (const [id, overwrite] of existingOverwrites.entries()) {
          if (id !== guildId && overwrite.type === 0) { // 0 = role type
            await discordCategory.permissionOverwrites.delete(id);
          }
        }
        
        // Füge die neuen Rollen-Berechtigungen hinzu
        for (const roleId of effectiveAllowedRoles) {
          if (typeof roleId === 'string') {
            try {
              await discordCategory.permissionOverwrites.edit(roleId, { ViewChannel: true });
              logger.info(`Rollenberechtigungen für ${roleId} aktualisiert`);
            } catch (err) {
              logger.error(`Fehler beim Setzen der Berechtigungen für Rolle ${roleId}:`, err);
            }
          }
        }
        logger.info(`Rollenberechtigungen aktualisiert mit ${effectiveAllowedRoles.length} Rollen`);
      } catch (err) {
        logger.error(`Fehler beim Aktualisieren der Rollenberechtigungen:`, err);
      }
    } else {
      logger.info(`Keine Rollen zum Aktualisieren gefunden`);
    }

    // Erfolgsmeldung
    logger.info(`Discord-Kategorie erfolgreich aktualisiert`);

    // Aktualisiere den Sync-Status
    await updateSyncStatus(
      categoryId,
      guildId,
      { 
        discord_id: discordCategoryId,
        updated_at: new Date().toISOString()
      },
      'synced'
    );
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren der Discord-Kategorie ${discordCategoryId}:`, error);

    // Fehler dokumentieren
    await updateSyncStatus(
      categoryId,
      guildId,
      { error_message: handleDiscordError(error) },
      'error'
    );
  }
}

/**
 * Abonniert UPDATE-Events für Kategorien und aktualisiert Discord-Kategorien
 * Verarbeitet auch die Task-Queue mit Rate-Limit-Verwaltung
 */
export function setupCategoryUpdateHandler(discordClient: Client) {
  console.log(`[UpdateCategory] Initialisiere Kategorie-Update-Handler für Guild: ${process.env.GUILD_ID || '*'}`);
  
  // Einmalige Bereinigung alter Tasks beim Start
  (async () => {
    try {
      // @ts-ignore - Wir müssen den TypeScript-Check deaktivieren
      await (supabase.rpc as any)('cleanup_stale_tasks');
      logger.info('Alte Tasks bereinigt');
    } catch (err) {
      logger.error('Fehler beim Bereinigen alter Tasks:', err);
    }
  })();
  
  // Starte einen Timer für die Queue-Verarbeitung (alle 10 Sekunden)
  const queueInterval = setInterval(() => {
    (async () => {
      try {
        await processTaskQueue(discordClient);
      } catch (error) {
        logger.error('Fehler bei der Queue-Verarbeitung:', error);
      }
    })();
  }, 10000);
  
  // Verwende den bestehenden Subscription-Mechanismus für Realtime-Events
  const cleanupSubscription = realtimeManager.subscribeToCategories(process.env.GUILD_ID || '*', async (payload) => {
    await processUpdateEvent(discordClient, payload);
  });
  
  // Kombinierte Cleanup-Funktion
  return () => {
    clearInterval(queueInterval);
    cleanupSubscription();
  };
}