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
  // Abonniere Änderungen an der categories-Tabelle
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
    
    if (!updatedCategory || !oldCategory) {
      logger.error('Kategoriedaten fehlen in Payload:', payload);
      return;
    }

    const { 
      id: categoryId, 
      name: newName, 
      guild_id: guildId, 
      discord_category_id: discordCategoryId 
    } = updatedCategory;

    // Wenn keine Discord-Kategorie-ID vorhanden ist, können wir nichts aktualisieren
    if (!discordCategoryId) {
      logger.warn(`Kategorie ${categoryId} hat keine Discord-Kategorie-ID, Überspringe Update`);
      return;
    }

    // Prüfe, ob sich der Name geändert hat (nur dann müssen wir Discord aktualisieren)
    if (newName === oldCategory.name) {
      logger.info(`Kein relevanter Unterschied für Discord-Update bei Kategorie ${categoryId}`);
      return;
    }

    logger.info(`Aktualisiere Discord-Kategorie "${oldCategory.name}" zu "${newName}" (ID: ${discordCategoryId})...`);

    try {
      // Versuche, die Guild zu finden
      const guild = await discordClient.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }

      // Hole die Discord-Kategorie
      const discordCategory = await guild.channels.fetch(discordCategoryId);
      if (!discordCategory) {
        throw new Error(`Discord-Kategorie mit ID ${discordCategoryId} nicht gefunden`);
      }

      // Aktualisiere den Namen der Discord-Kategorie
      await discordCategory.setName(newName);

      logger.info(`Discord-Kategorie umbenannt zu "${newName}"`);

      // Aktualisiere den Sync-Status
      await supabase
        .from('discord_sync')
        .insert({
          id: categoryId,
          entity_type: 'category',
          guild_id: guildId,
          data: { discord_id: discordCategoryId },
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

  // Abonniere DELETE-Events für Kategorien
  const unsubscribeFromDeletes = realtimeManager.subscribeToCategories(process.env.GUILD_ID || '*', async (payload) => {
    // Debug-Ausgabe für alle empfangenen Ereignisse
    console.log('Kategorie-Event empfangen:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      newData: payload.new,
      oldData: payload.old
    });
    
    // Nur DELETE-Events verarbeiten
    if (payload.eventType !== 'DELETE') {
      return;
    }

    // Bei DELETE haben wir nur die alten Daten
    const deletedCategory = payload.old;
    
    if (!deletedCategory) {
      logger.error('Gelöschte Kategoriedaten fehlen in Payload:', payload);
      return;
    }

    const { 
      id: categoryId, 
      name, 
      guild_id: guildId, 
      discord_category_id: discordCategoryId 
    } = deletedCategory;

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
      const discordCategory = await guild.channels.fetch(discordCategoryId);
      if (!discordCategory) {
        logger.warn(`Discord-Kategorie mit ID ${discordCategoryId} bereits gelöscht oder nicht gefunden`);
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
  });

  // Rückgabe einer Cleanup-Funktion, um alle Abonnements zu beenden
  return () => {
    unsubscribeFromInserts();
    unsubscribeFromUpdates();
    unsubscribeFromDeletes();
  };
}
