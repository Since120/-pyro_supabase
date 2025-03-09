/**
 * Dieses Skript erstellt eine gemeinsame PubSubEvents-Definition für API und Bot
 * Es erstellt eine Typenschnittstelle, die von beiden Komponenten genutzt werden kann
 */
const fs = require('fs');
const path = require('path');

// Pfade zu den Quell- und Zieldateien
const apiSourcePath = path.resolve(__dirname, '../apps/api/src/redis/models/pubsub.model.ts');
const targetDir = path.resolve(__dirname, '../packages/types');
const targetPath = path.resolve(targetDir, 'pubsub.ts');

console.log(`API Source path: ${apiSourcePath}`);
console.log(`Target path: ${targetPath}`);

// Überprüfe, ob die Quelldatei existiert
if (!fs.existsSync(apiSourcePath)) {
  console.error(`API Quelldatei nicht gefunden: ${apiSourcePath}`);
  process.exit(1);
}

// Stelle sicher, dass das Zielverzeichnis existiert
if (!fs.existsSync(targetDir)) {
  console.log(`Zielverzeichnis nicht gefunden, erstelle: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// Lese die API Quelldatei
const apiSourceContent = fs.readFileSync(apiSourcePath, 'utf8');

// Erstelle die zentrale Typdefinition für PubSubEvents
const generatePubSubTypes = () => {
  // In der neuen Version erstellen wir eine vereinfachte Version der PubSub-Typen
  // Die komplette Typensicherheit kommt aus den generierten GraphQL-Typen
  return `/**
 * AUTOMATISCH GENERIERTE DATEI
 * Diese Datei wurde automatisch durch das copy-pubsub-types.js Skript generiert.
 * Nicht manuell bearbeiten!
 * 
 * Sie definiert die gemeinsamen Redis-PubSub-Event-Typen für API und Bot.
 */

import { 
  Category, CategoryEvent, ZoneEvent, RoleEvent, ChannelEvent
} from './generated/graph';

/**
 * Definiert die Event-Typen, die über Redis PubSub ausgetauscht werden.
 * Alle Komponenten (API, Bot, Dashboard) sollten dieses Interface verwenden.
 */
export interface PubSubEvents {
  // Standardisierte Events für Kategorien
  categoryEvent: CategoryEvent;
  
  // Standardisierte Events für Zonen
  zoneEvent: ZoneEvent;
  
  // Standardisierte Events für Rollen
  roleEvent: RoleEvent;
  
  // Standardisierte Events für Channels
  channelEvent: ChannelEvent;

  // Legacy: Alte Category Events (Kompatibilität)
  categoryCreated: Partial<Category> & { id: string; name: string; guildId: string; };
  categoryUpdated: Partial<Category> & { id: string; };
  categoryDeleted: { id: string; discordCategoryId?: string; guildId: string; };
  
  // Category Confirmation Events
  categoryCreatedConfirmation: {
    apiCategoryId: string;
    discordCategoryId: string;
    guildId: string;
    timestamp: string;
  };
  categoryUpdateConfirmed: {
    apiCategoryId: string;
    discordCategoryId?: string;
    guildId: string;
    name?: string;
    noChangeNeeded?: boolean;
    timestamp: string;
  };
  categoryDeleteConfirmed: {
    apiCategoryId: string;
    timestamp: string;
  };
  
  // Category Error Events
  categoryUpdateError: {
    apiCategoryId: string;
    error: string;
    originalPayload?: any;
    timestamp: string;
  };
  categoryDeleteError: {
    apiCategoryId: string;
    error: string;
    timestamp: string;
  };
  categoryError: {
    eventId: string;
    error: string;
    originalPayload?: any;
    timestamp: string;
    errorDetails?: {
      message: string;
      code?: string | number;
    };
  };
  
  // Legacy: Alte Zone Events (Kompatibilität)
  zoneCreated: {
    id: string;
    name: string;
    zoneKey: string;
    categoryId: string;
    category: {
      id: string;
      guildId?: string;
      discordCategoryId?: string;
    };
  };
  zoneUpdated: {
    id: string;
    name?: string;
    discordVoiceId?: string;
    category?: {
      discordCategoryId?: string;
    };
  };
  zoneDeleted: { 
    id: string; 
    discordVoiceId?: string | null;
  };
  
  // Zone Confirmation Events
  zoneCreatedConfirmation: {
    apiZoneId: string;
    discordVoiceId: string;
    timestamp: string;
  };
  zoneUpdateConfirmed: {
    apiZoneId: string;
    discordVoiceId?: string;
    timestamp: string;
  };
  zoneDeleteConfirmed: {
    apiZoneId: string;
    timestamp: string;
  };
  
  // Zone Error Events
  zoneUpdateError: {
    apiZoneId: string;
    error: string;
    timestamp: string;
  };
  zoneDeleteError: {
    apiZoneId: string;
    error: string;
    timestamp: string;
  };
  
  // Role Events
  rolesRequest: {
    requestId: string;
    guildId: string;
    timestamp?: string;
  };
  rolesResponse: {
    requestId: string;
    guildId?: string;
    timestamp?: string;
    roles?: any[];
    error?: string;
  };
  rolesError: {
    requestId: string;
    error: string;
    guildId?: string;
    timestamp?: string;
  };
  
  // Channel Events
  channelsRequest: {
    requestId: string;
    guildId: string;
    timestamp?: string;
  };
  channelsResponse: {
    requestId: string;
    guildId?: string;
    timestamp?: string;
    channels?: any[];
    error?: string;
  };
  channelsError: {
    requestId: string;
    error: string;
    guildId?: string;
    timestamp?: string;
  };
  
  // Rate Limit Events
  rateLimitReached: {
    discordCategoryId: string;
    guildId: string;
    delayMinutes: number;
    message: string;
  };
  zoneRateLimitReached: {
    discordVoiceId?: string;
    guildId: string;
    delayMinutes: number;
    message: string;
  };
  
  // Channel mapping events
  categoryUpdateEvent: {
    categoryId?: string;
    channelIds?: string[];
    action?: 'add' | 'remove' | 'update';
    timestamp?: string;
    discordVoiceId?: string;
    discordCategoryId?: string;
  };
}

/**
 * Definiert die Struktur für Redis PubSub Subscriptions.
 * Wird verwendet, um Rückgabewerte von Subscription-Funktionen zu typisieren.
 */
export interface PubSubSubscription<T> {
  unsubscribe: () => void;
  data?: T;
}

// Exportiere auch spezifische Event-Typen für einfachere Verwendung
export type CategoryCreatedEvent = PubSubEvents['categoryCreated'];
export type CategoryUpdatedEvent = PubSubEvents['categoryUpdated'];
export type CategoryDeletedEvent = PubSubEvents['categoryDeleted'];
export type ZoneCreatedEvent = PubSubEvents['zoneCreated'];
export type ZoneUpdatedEvent = PubSubEvents['zoneUpdated'];
export type ZoneDeletedEvent = PubSubEvents['zoneDeleted'];
`;
};

// Erstelle auch die entsprechende Bot-Anpassung für redis.pubsub.ts
const botRedisPubSubPath = path.resolve(__dirname, '../apps/bot/src/pubsub/redis.pubsub.model.ts');
const createBotRedisPubSubModel = () => {
  return `/**
 * AUTOMATISCH GENERIERTE DATEI
 * Diese Datei wurde automatisch durch das copy-pubsub-types.js Skript generiert.
 * Nicht manuell bearbeiten!
 * 
 * Sie enthält die Anpassung für den Redis-PubSub-Service des Bots.
 */

import { PubSubEvents, PubSubSubscription } from 'pyro-types/pubsub';

// Re-exportiere die Typen für lokale Verwendung
export type { PubSubEvents, PubSubSubscription };

// Typ für Redis-Events
export type RedisEvents = PubSubEvents;
`;
};

// Schreibe die Typdefinition in die Zieldatei
const generatedTypes = generatePubSubTypes();
fs.writeFileSync(targetPath, generatedTypes);

// Erstelle die Redis-PubSub-Model Datei für den Bot
const botModelContent = createBotRedisPubSubModel();
fs.writeFileSync(botRedisPubSubPath, botModelContent);

// Stelle sicher, dass die pubsub.ts in der index.ts exportiert wird
const typesIndexPath = path.resolve(targetDir, 'index.ts');
if (fs.existsSync(typesIndexPath)) {
  let indexContent = fs.readFileSync(typesIndexPath, 'utf8');
  if (!indexContent.includes("export * from './pubsub'")) {
    // Füge den Export hinzu
    indexContent += "\n// Export PubSub-Typen\nexport * from './pubsub';\n";
    fs.writeFileSync(typesIndexPath, indexContent);
    console.log(`PubSub-Typen zum Index hinzugefügt: ${typesIndexPath}`);
  }
}

console.log(`PubSub-Typen erfolgreich nach ${targetPath} kopiert.`);
console.log(`Bot-Adapter erfolgreich nach ${botRedisPubSubPath} kopiert.`);