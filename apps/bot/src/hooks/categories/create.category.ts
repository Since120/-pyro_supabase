// apps/bot/src/hooks/categories/create.category.ts
import { Client, ChannelType } from 'discord.js';
import { supabase, realtimeManager } from 'pyro-types';
import logger from 'pyro-logger';
import { MAX_RETRY_ATTEMPTS, BASE_RETRY_DELAY, updateSyncStatus, handleDiscordError } from './helpers';

/**
 * Abonniert INSERT-Events für Kategorien und erstellt Discord-Kategorien
 */
export function setupCategoryCreateHandler(discordClient: Client) {
  return realtimeManager.subscribeToCategories(process.env.GUILD_ID || '*', async (payload) => {
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

      // Fehler dokumentieren
      await updateSyncStatus(
        categoryId,
        guildId || '',
        { error_message: 'Fehlende Pflichtfelder (categoryId, guildId oder name)' },
        'error'
      );
      return;
    }

    // Wenn Kategorie bereits in Discord existiert, nichts weiter tun
    if (discordCategoryId) {
      logger.info('Kategorie existiert bereits in Discord:', discordCategoryId);

      // Bestätigen, dass es bereits synchronisiert ist
      await updateSyncStatus(
        categoryId,
        guildId,
        { discord_id: discordCategoryId },
        'synced'
      );
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
      await updateSyncStatus(
        categoryId,
        guildId,
        { discord_id: discordCategory.id },
        'synced'
      );

      logger.info(`Kategorie "${name}" wurde erfolgreich in Discord erstellt und in der Datenbank aktualisiert.`);
    } catch (error) {
      logger.error('Fehler beim Erstellen der Discord-Kategorie:', error);

      // Fehler dokumentieren
      await updateSyncStatus(
        categoryId,
        guildId,
        { error_message: handleDiscordError(error) },
        'error'
      );
    }
  });
}