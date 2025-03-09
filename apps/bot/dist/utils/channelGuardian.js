"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChannelUpdateListener = setupChannelUpdateListener;
// apps/bot/src/utils/channelGuardian.ts
const discord_js_1 = require("discord.js");
const channelMapping_1 = require("./channelMapping");
const pyro_logger_1 = __importDefault(require("pyro-logger"));
/**
 * Sets up a listener for channel updates to ensure voice channels stay in their assigned categories
 * @param discordClient Discord.js client instance
 */
function setupChannelUpdateListener(discordClient) {
    discordClient.on('channelUpdate', async (oldChannel, newChannel) => {
        // Only check voice channels
        if (!(newChannel instanceof discord_js_1.VoiceChannel))
            return;
        // Get the expected parent from Redis
        const expectedCategoryId = await (0, channelMapping_1.getChannelMapping)(newChannel.id);
        if (!expectedCategoryId)
            return; // No mapping found, nothing to do
        // If the current parent doesn't match the expected one, move it back
        if (newChannel.parentId !== expectedCategoryId) {
            pyro_logger_1.default.info(`Channel ${newChannel.name} wurde manuell verschoben. Erwarteter Parent: ${expectedCategoryId}, aktueller Parent: ${newChannel.parentId}`);
            try {
                await newChannel.setParent(expectedCategoryId);
                pyro_logger_1.default.info(`Channel ${newChannel.name} wurde wieder in die korrekte Kategorie verschoben.`);
            }
            catch (error) {
                pyro_logger_1.default.error(`Fehler beim Zurückverschieben des Channels ${newChannel.name}:`, error);
            }
        }
    });
}
