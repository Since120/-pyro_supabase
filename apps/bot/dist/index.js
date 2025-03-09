"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/bot/src/index.ts
require("dotenv/config");
const discord_js_1 = require("discord.js");
const express_1 = __importDefault(require("express"));
const pyro_logger_1 = __importDefault(require("pyro-logger"));
const events_1 = require("./events");
const utils_1 = require("./utils");
const roles_listener_1 = require("./modules/roles.listener");
// Environment variables and setup
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
if (!DISCORD_TOKEN) {
    pyro_logger_1.default.error('DISCORD_TOKEN ist nicht in den Umgebungsvariablen definiert.');
    process.exit(1);
}
if (!GUILD_ID) {
    pyro_logger_1.default.error('GUILD_ID ist nicht in den Umgebungsvariablen definiert.');
    process.exit(1);
}
// Discord client setup
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
const app = (0, express_1.default)();
const port = process.env.BOT_PORT ? parseInt(process.env.BOT_PORT, 10) : 3003;
// Discord client events
client.on('debug', (info) => {
    pyro_logger_1.default.info('Discord.js debug:', info);
});
client.on('rateLimit', (info) => {
    pyro_logger_1.default.warn(`Rate limit hit on route ${info.route}: retry after ${info.retryAfter}ms`);
});
client.once('ready', async () => {
    pyro_logger_1.default.info('Bot ist online');
    // Rebuild channel mapping on startup
    await (0, utils_1.rebuildChannelMapping)();
    // Setup channel update listener
    (0, utils_1.setupChannelUpdateListener)(client);
    // Initialize roles listener
    new roles_listener_1.RolesListener(client);
    // Start event handlers for categories and zones
    (0, events_1.handleCategoryCreated)(client);
    (0, events_1.handleCategoryUpdated)(client);
    (0, events_1.handleCategoryDeleted)(client);
    (0, events_1.handleZoneCreated)(client);
    (0, events_1.handleZoneUpdated)(client);
    (0, events_1.handleZoneDeleted)(client);
    // Simple HTTP Status-Server einrichten
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.get('/', (req, res) => res.send('Bot läuft!'));
    app.listen(port, () => {
        pyro_logger_1.default.info(`HTTP-Status-Server läuft auf Port ${port}`);
    });
});
// Log in to Discord
client.login(DISCORD_TOKEN).catch(error => {
    pyro_logger_1.default.error('Fehler beim Login:', error);
    process.exit(1);
});
