/**
 * AUTOMATISCH GENERIERTE DATEI
 * Diese Datei wurde automatisch durch das copy-pubsub-types.js Skript generiert.
 * Nicht manuell bearbeiten!
 *
 * Sie definiert die gemeinsamen Redis-PubSub-Event-Typen für API und Bot.
 */
import { Category, CategoryEvent, ZoneEvent, RoleEvent, ChannelEvent } from './generated/graph';
/**
 * Definiert die Event-Typen, die über Redis PubSub ausgetauscht werden.
 * Alle Komponenten (API, Bot, Dashboard) sollten dieses Interface verwenden.
 */
export interface PubSubEvents {
    categoryEvent: CategoryEvent;
    zoneEvent: ZoneEvent;
    roleEvent: RoleEvent;
    channelEvent: ChannelEvent;
    categoryCreated: Partial<Category> & {
        id: string;
        name: string;
        guildId: string;
    };
    categoryUpdated: Partial<Category> & {
        id: string;
    };
    categoryDeleted: {
        id: string;
        discordCategoryId?: string;
        guildId: string;
    };
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
export type CategoryCreatedEvent = PubSubEvents['categoryCreated'];
export type CategoryUpdatedEvent = PubSubEvents['categoryUpdated'];
export type CategoryDeletedEvent = PubSubEvents['categoryDeleted'];
export type ZoneCreatedEvent = PubSubEvents['zoneCreated'];
export type ZoneUpdatedEvent = PubSubEvents['zoneUpdated'];
export type ZoneDeletedEvent = PubSubEvents['zoneDeleted'];
