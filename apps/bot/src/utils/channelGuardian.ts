// apps/bot/src/utils/channelGuardian.ts - Migriert zu Supabase
import { Client, VoiceChannel } from 'discord.js';
import { getChannelMapping } from './channelMapping';
import logger from 'pyro-logger';

/**
 * Sets up a listener for channel updates to ensure voice channels stay in their assigned categories
 * @param discordClient Discord.js client instance
 */
export function setupChannelUpdateListener(discordClient: Client): void {
  discordClient.on('channelUpdate', async (oldChannel, newChannel) => {
    // Only check voice channels
    if (!(newChannel instanceof VoiceChannel)) return;

    // Get the expected parent from our mapping cache (or Supabase if needed)
    const expectedCategoryId = await getChannelMapping(newChannel.id);
    if (!expectedCategoryId) return; // No mapping found, nothing to do

    // If the current parent doesn't match the expected one, move it back
    if (newChannel.parentId !== expectedCategoryId) {
      logger.info(`Channel ${newChannel.name} wurde manuell verschoben. Erwarteter Parent: ${expectedCategoryId}, aktueller Parent: ${newChannel.parentId}`);
      
      try {
        // Typensicherer Zugriff
        await newChannel.setParent(expectedCategoryId as string);
        logger.info(`Channel ${newChannel.name} wurde wieder in die korrekte Kategorie verschoben.`);
      } catch (error) {
        logger.error(`Fehler beim Zurückverschieben des Channels ${newChannel.name}:`, error);
      }
    }
  });
}