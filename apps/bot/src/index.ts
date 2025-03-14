// apps/bot/src/index.ts
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';
import logger from 'pyro-logger';
import { 
  handleZoneCreated, 
  handleZoneUpdated, 
  handleZoneDeleted 
} from './events';
import { rebuildChannelMapping, setupChannelUpdateListener } from './utils';
import { RolesListener } from './modules/roles.listener';
import { setupCategoryEventHandlers } from './hooks/categories';

// Environment variables and setup
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN ist nicht in den Umgebungsvariablen definiert.');
  process.exit(1);
}

if (!GUILD_ID) {
  logger.error('GUILD_ID ist nicht in den Umgebungsvariablen definiert.');
  process.exit(1);
}

// Express App für Health-Checks
const app = express();
const port = process.env.PORT || 3001;

// Setup Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

// Uncomment für Debug-Infos zu Discord.js Events
// client.on('debug', m => logger.debug('Discord.js Debug:', m));

client.on('error', error => {
  logger.error('Discord client error:', error);
});

client.on('rateLimit', (info) => {
  logger.warn(`Rate limit hit on route ${info.route}: retry after ${info.retryAfter}ms`);
});

// Login to Discord
client.login(DISCORD_TOKEN).catch(error => {
  logger.error('Fehler beim Login:', error);
  process.exit(1);
});

// Variable für Cleanup-Funktion des Supabase-Handlers
let cleanupCategories: (() => void) | null = null;

client.once('ready', async () => {
  logger.info('Bot ist online');

  // Rebuild channel mapping on startup
  await rebuildChannelMapping();
  
  // Setup channel update listener
  setupChannelUpdateListener(client);

  // Initialize roles listener
  new RolesListener(client);

  // Starte den Supabase-basierten Kategorie-Handler
  cleanupCategories = setupCategoryEventHandlers(client);
  logger.info('Supabase Kategorie-Handler initialisiert');

  // Zone-Handler (alle Supabase-basiert)
  const cleanupZoneCreated = handleZoneCreated(client);
  const cleanupZoneUpdated = handleZoneUpdated(client);
  const cleanupZoneDeleted = handleZoneDeleted(client);
  logger.info('Alle Supabase Zone-Handler initialisiert');
  
  // Cleanup-Funktion erweitern
  const originalCleanup = cleanupCategories;
  cleanupCategories = () => {
    if (originalCleanup) originalCleanup();
    if (cleanupZoneCreated) cleanupZoneCreated();
    if (cleanupZoneUpdated) cleanupZoneUpdated();
    if (cleanupZoneDeleted) cleanupZoneDeleted();
  };

  // Simple HTTP Status-Server einrichten
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/', (req, res) => res.send('Bot läuft!'));
  
  app.listen(port, () => {
    logger.info(`Status-Server läuft auf Port ${port}`);
  });
});

// Cleanup resources when app is shutting down
process.on('SIGINT', () => {
  logger.info('SIGINT erhalten, räume auf...');
  if (cleanupCategories) {
    cleanupCategories();
  }
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM erhalten, räume auf...');
  if (cleanupCategories) {
    cleanupCategories();
  }
  client.destroy();
  process.exit(0);
});