// This file replaces the previous pubsub.ts with Supabase Realtime functionality

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Types for the events that can be subscribed to
export type CategoryCreatedEvent = {
  id: string;
  guild_id: string;
  name: string;
};

export type CategoryUpdatedEvent = {
  id: string;
  guild_id: string;
  name?: string;
  settings?: any;
};

export type ZoneCreatedEvent = {
  id: string;
  category_id: string;
  name: string;
  zone_key: string;
};

export type ZoneUpdatedEvent = {
  id: string;
  category_id: string;
  name?: string;
  settings?: any;
};

export type DiscordEntitySyncEvent = {
  id: string;
  entity_type: string;
  guild_id: string;
  sync_status: string;
};

// Class to handle Supabase Realtime subscriptions
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to category changes
  subscribeToCategories(guildId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void {
    const channelKey = `categories:${guildId}`;
    
    if (this.channels.has(channelKey)) {
      console.log(`[RealtimeManager] Bereits abonniert auf Kanal ${channelKey}, gebe bestehenden Unsubscribe zurück`);
      return () => this.unsubscribeFromChannel(channelKey);
    }
    
    // Konfiguration für alle Events (INSERT, UPDATE, DELETE)
    const filter = guildId !== '*' ? `guild_id=eq.${guildId}` : undefined;
    
    console.log(`[RealtimeManager] Abonniere Kategorie-Events für Guild ${guildId}, Filter: ${filter || 'Alle Guilds'}`);
    
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: filter
        },
        (payload) => {
          const newIdStr = payload.new && typeof payload.new === 'object' ? (payload.new as any).id : 'unbekannt';
          const oldIdStr = payload.old && typeof payload.old === 'object' ? (payload.old as any).id : 'unbekannt';
          
          console.log(`[RealtimeManager] Kategorie-Event empfangen: ${payload.eventType} für ID ${newIdStr || oldIdStr || 'unbekannt'}`);
          
          // Füge mehr Details für UPDATE-Events hinzu
          if (payload.eventType === 'UPDATE') {
            const oldData = payload.old || {};
            const newData = payload.new || {};
            
            console.log(`[RealtimeManager] UPDATE Details - Alter Name: "${(oldData as any).name || 'unbekannt'}", Neuer Name: "${(newData as any).name || 'unbekannt'}"`);
            
            // Prüfe auf tatsächliche Änderungen
            const changedFields = Object.keys(newData).filter(key => {
              // Ignoriere updated_at, das ändert sich immer
              if (key === 'updated_at') return false;
              
              // Prüfe auf tatsächliche Änderungen in anderen Feldern
              return JSON.stringify((oldData as any)[key]) !== JSON.stringify((newData as any)[key]);
            });
            
            if (changedFields.length > 0) {
              console.log(`[RealtimeManager] Geänderte Felder:`, changedFields);
            } else {
              console.log(`[RealtimeManager] WARNUNG: Keine tatsächlichen Änderungen erkannt trotz UPDATE-Event`);
            }
          }
          
          try {
            callback(payload);
          } catch (error) {
            console.error(`[RealtimeManager] Fehler beim Verarbeiten des Events:`, error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[RealtimeManager] Kanal '${channelKey}' Status: ${status}`);
      });
      
    this.channels.set(channelKey, channel);
    
    return () => this.unsubscribeFromChannel(channelKey);
  }
  
  // Subscribe to zone changes
  subscribeToZones(categoryId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void {
    const channelKey = `zones:${categoryId}`;
    
    if (this.channels.has(channelKey)) {
      return () => this.unsubscribeFromChannel(channelKey);
    }
    
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zones',
          filter: `category_id=eq.${categoryId}`
        },
        callback
      )
      .subscribe();
      
    this.channels.set(channelKey, channel);
    
    return () => this.unsubscribeFromChannel(channelKey);
  }
  
  // Subscribe to events
  subscribeToEvents(callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void {
    const channelKey = 'events';
    
    if (this.channels.has(channelKey)) {
      return () => this.unsubscribeFromChannel(channelKey);
    }
    
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: 'processed=eq.false'
        },
        callback
      )
      .subscribe();
      
    this.channels.set(channelKey, channel);
    
    return () => this.unsubscribeFromChannel(channelKey);
  }
  
  // Subscribe to discord_sync table for categories and zones sync status
  subscribeToDiscordSync(guildId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void {
    const channelKey = `discord_sync:${guildId}`;
    
    if (this.channels.has(channelKey)) {
      return () => this.unsubscribeFromChannel(channelKey);
    }
    
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discord_sync',
          filter: `guild_id=eq.${guildId}`
        },
        callback
      )
      .subscribe();
      
    this.channels.set(channelKey, channel);
    
    return () => this.unsubscribeFromChannel(channelKey);
  }
  
  // Unsubscribe from a channel
  private unsubscribeFromChannel(channelKey: string): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }
  
  // Unsubscribe from all channels
  unsubscribeAll(): void {
    for (const [key, channel] of this.channels) {
      supabase.removeChannel(channel);
      this.channels.delete(key);
    }
  }
}

// Export a singleton instance
export const realtimeManager = new RealtimeManager();