"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildChannelMapping = rebuildChannelMapping;
exports.getChannelMapping = getChannelMapping;
exports.setChannelMapping = setChannelMapping;
// apps/bot/src/utils/channelMapping.ts
const redis_pubsub_1 = require("../pubsub/redis.pubsub");
const core_1 = require("@apollo/client/core");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const pyro_logger_1 = __importDefault(require("pyro-logger"));
// Create a dedicated Apollo client for API queries
const apiClient = new core_1.ApolloClient({
    link: new core_1.HttpLink({
        uri: process.env.API_URL + '/graphql',
        fetch: cross_fetch_1.default,
    }),
    cache: new core_1.InMemoryCache(),
});
// GraphQL query to get all zones
const GET_ZONES = (0, core_1.gql) `
  query GetZones {
    zones {
      discordVoiceId
      category {
        discordCategoryId
      }
    }
  }
`;
/**
 * Rebuilds the channel mapping from the API data
 * This ensures that the bot knows which voice channel belongs to which category
 */
async function rebuildChannelMapping() {
    try {
        const result = await apiClient.query({ query: GET_ZONES });
        const zones = result.data?.zones;
        if (zones && zones.length > 0) {
            let mappingCount = 0;
            for (const zone of zones) {
                if (zone.discordVoiceId && zone.category && zone.category.discordCategoryId) {
                    // Store the mapping in Redis
                    await setChannelMapping(zone.discordVoiceId, zone.category.discordCategoryId);
                    mappingCount++;
                }
            }
            pyro_logger_1.default.info(`Channel mapping rebuilt successfully. Mapped ${mappingCount} channels.`);
        }
        else {
            pyro_logger_1.default.warn('No zones found, channel mapping not rebuilt.');
        }
    }
    catch (error) {
        pyro_logger_1.default.error('Error rebuilding channel mapping:', error);
    }
}
/**
 * Gets the channel mapping from Redis
 * @param discordVoiceId Discord voice channel ID
 * @returns Discord category ID or null if not found
 */
async function getChannelMapping(discordVoiceId) {
    return redis_pubsub_1.redisPubSub.redisSubscriber.get(`voiceChannel:${discordVoiceId}`);
}
/**
 * Sets the channel mapping in Redis
 * @param discordVoiceId Discord voice channel ID
 * @param discordCategoryId Discord category ID
 */
async function setChannelMapping(discordVoiceId, discordCategoryId) {
    // Set the mapping in Redis
    await redis_pubsub_1.redisPubSub.redisPublisher.set(`voiceChannel:${discordVoiceId}`, discordCategoryId);
    // Publish an event to notify other services
    await redis_pubsub_1.redisPubSub.publish('categoryUpdateEvent', {
        discordVoiceId,
        discordCategoryId,
    });
    pyro_logger_1.default.debug(`Channel mapping set: ${discordVoiceId} -> ${discordCategoryId}`);
}
