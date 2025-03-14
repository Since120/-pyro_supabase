// apps/bot/src/hooks/categories/update.category.ts
import { Client, ChannelType } from 'discord.js';
import { supabase, realtimeManager } from 'pyro-types';
import logger from 'pyro-logger';
import { fetchCompleteCategory, updateSyncStatus, handleDiscordError, CategoryRow } from './helpers';

/**
 * Abonniert UPDATE-Events für Kategorien und aktualisiert Discord-Kategorien
 */
export function setupCategoryUpdateHandler(discordClient: Client) {
  return realtimeManager.subscribeToCategories(process.env.GUILD_ID || '*', async (payload) => {
    // Nur UPDATE-Events verarbeiten
    if (payload.eventType !== 'UPDATE') {
      return;
    }

    const updatedCategory = payload.new as CategoryRow;
    const oldCategory = payload.old as Partial<CategoryRow>;
    
    if (!updatedCategory) {
      logger.error('Kategoriedaten fehlen in Payload:', payload);
      return;
    }

    const { 
      id: categoryId, 
      name: newName, 
      guild_id: guildId, 
      discord_category_id: discordCategoryId
    } = updatedCategory;

    // Extrahieren der is_* Felder mit Typ-Sicherheit
    const isVisible = updatedCategory.is_visible ?? true;
    const allowedRoles = updatedCategory.allowed_roles || [];

    // Wenn keine Discord-Kategorie-ID vorhanden ist, können wir nichts aktualisieren
    if (!discordCategoryId) {
      logger.warn(`Kategorie ${categoryId} hat keine Discord-Kategorie-ID, Überspringe Update`);
      return;
    }

    // Bei unvollständigen Daten: Hole die kompletten Informationen
    if (!oldCategory || Object.keys(oldCategory).length <= 1) {
      console.log('Unvollständige Kategorie-Informationen erkannt, hole vollständige Daten...');
      
      // Vollständige Kategorie-Informationen aus der Datenbank holen
      const completeCategory = await fetchCompleteCategory(categoryId);
      
      if (completeCategory) {
        // Wenn wir vollständige Daten haben, setzen wir sie als Basis für den Vergleich
        console.log('Vollständige Kategorie-Informationen erhalten:', completeCategory);
        
        // Prüfe, ob sich tatsächlich etwas geändert hat im Vergleich zu den vollständigen Daten
        const nameChanged = newName !== completeCategory.name;
        const visibilityChanged = isVisible !== completeCategory.is_visible;
        const rolesChanged = JSON.stringify(allowedRoles) !== JSON.stringify(completeCategory.allowed_roles);
        
        console.log('Änderungserkennung mit vollständigen Daten:', {
          nameChanged,
          visibilityChanged,
          rolesChanged
        });
        
        // Wenn KEINE Änderungen entdeckt wurden, können wir hier abbrechen
        if (!nameChanged && !visibilityChanged && !rolesChanged) {
          logger.info(`Keine relevanten Änderungen für Kategorie ${categoryId} erkannt`);
          return;
        }
        
        // Andernfalls verarbeiten wir nur die tatsächlichen Änderungen
        // Das reduziert unnötige Discord-API-Aufrufe
        if (nameChanged) {
          logger.info(`Name geändert: "${completeCategory.name}" -> "${newName}"`);
        }
        if (visibilityChanged) {
          logger.info(`Sichtbarkeit geändert: ${completeCategory.is_visible} -> ${isVisible}`);
        }
        if (rolesChanged) {
          logger.info(`Rollen geändert`);
        }
      } else {
        // Wenn wir keine vollständigen Daten bekommen, nehmen wir einfach an, dass sich etwas geändert hat
        logger.info(`Konnte keine vollständigen Kategoriedaten abrufen, führe Update durch`);
      }
    } else {
      // Normale Vergleiche, wenn oldCategory vollständig ist
      const nameChanged = newName !== oldCategory.name;
      const visibilityChanged = isVisible !== oldCategory.is_visible;
      const rolesChanged = JSON.stringify(allowedRoles) !== JSON.stringify(oldCategory.allowed_roles);
      
      if (!nameChanged && !visibilityChanged && !rolesChanged) {
        logger.info(`Kein relevanter Unterschied für Discord-Update bei Kategorie ${categoryId}`);
        return;
      }
      
      if (nameChanged) logger.info(`Name: "${oldCategory.name}" -> "${newName}"`);
      if (visibilityChanged) logger.info(`Sichtbarkeit: ${oldCategory.is_visible} -> ${isVisible}`);
      if (rolesChanged) logger.info(`Rollen geändert`);
    }

    try {
      // Versuche, die Guild zu finden
      const guild = await discordClient.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }

      // Hole die Discord-Kategorie
      console.log(`Versuche Kanal mit ID ${discordCategoryId} zu finden...`);
      const discordCategory = await guild.channels.fetch(discordCategoryId);
      
      if (!discordCategory) {
        throw new Error(`Discord-Kategorie mit ID ${discordCategoryId} nicht gefunden`);
      }
      
      // Prüfen des Discord-Kanal-Typs
      if (discordCategory.type !== ChannelType.GuildCategory) {
        throw new Error(`Kanal mit ID ${discordCategoryId} ist keine Kategorie, sondern vom Typ ${discordCategory.type}`);
      }

      // Name ändern, wenn nötig
      try {
        console.log(`Führe Umbenennung zu "${newName}" durch`);
        await discordCategory.edit({ name: newName });
        console.log('Umbenennung erfolgreich');
      } catch (err) {
        console.error('Fehler bei der Umbenennung:', err);
        throw err;
      }

      // Sichtbarkeit ändern, wenn nötig
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

      // Rollen-Berechtigungen aktualisieren, wenn nötig
      if (Array.isArray(allowedRoles)) {
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
        { 
          discord_id: discordCategoryId, 
          error_message: handleDiscordError(error) 
        },
        'error'
      );
    }
  });
}