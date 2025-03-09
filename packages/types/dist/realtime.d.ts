import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
export declare class RealtimeManager {
    private channels;
    subscribeToCategories(guildId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void;
    subscribeToZones(categoryId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void;
    subscribeToEvents(callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void;
    private unsubscribeFromChannel;
    unsubscribeAll(): void;
}
export declare const realtimeManager: RealtimeManager;
