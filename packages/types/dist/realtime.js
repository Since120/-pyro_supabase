"use strict";
// This file replaces the previous pubsub.ts with Supabase Realtime functionality
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeManager = exports.RealtimeManager = void 0;
const supabase_1 = require("./supabase");
// Class to handle Supabase Realtime subscriptions
class RealtimeManager {
    constructor() {
        this.channels = new Map();
    }
    // Subscribe to category changes
    subscribeToCategories(guildId, callback) {
        const channelKey = `categories:${guildId}`;
        if (this.channels.has(channelKey)) {
            return () => this.unsubscribeFromChannel(channelKey);
        }
        const channel = supabase_1.supabase
            .channel(channelKey)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'categories',
            filter: `guild_id=eq.${guildId}`
        }, callback)
            .subscribe();
        this.channels.set(channelKey, channel);
        return () => this.unsubscribeFromChannel(channelKey);
    }
    // Subscribe to zone changes
    subscribeToZones(categoryId, callback) {
        const channelKey = `zones:${categoryId}`;
        if (this.channels.has(channelKey)) {
            return () => this.unsubscribeFromChannel(channelKey);
        }
        const channel = supabase_1.supabase
            .channel(channelKey)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'zones',
            filter: `category_id=eq.${categoryId}`
        }, callback)
            .subscribe();
        this.channels.set(channelKey, channel);
        return () => this.unsubscribeFromChannel(channelKey);
    }
    // Subscribe to events
    subscribeToEvents(callback) {
        const channelKey = 'events';
        if (this.channels.has(channelKey)) {
            return () => this.unsubscribeFromChannel(channelKey);
        }
        const channel = supabase_1.supabase
            .channel(channelKey)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
            filter: 'processed=eq.false'
        }, callback)
            .subscribe();
        this.channels.set(channelKey, channel);
        return () => this.unsubscribeFromChannel(channelKey);
    }
    // Unsubscribe from a channel
    unsubscribeFromChannel(channelKey) {
        const channel = this.channels.get(channelKey);
        if (channel) {
            supabase_1.supabase.removeChannel(channel);
            this.channels.delete(channelKey);
        }
    }
    // Unsubscribe from all channels
    unsubscribeAll() {
        for (const [key, channel] of this.channels) {
            supabase_1.supabase.removeChannel(channel);
            this.channels.delete(key);
        }
    }
}
exports.RealtimeManager = RealtimeManager;
// Export a singleton instance
exports.realtimeManager = new RealtimeManager();
