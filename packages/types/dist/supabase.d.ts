import type { Database } from './generated/supabase';
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<Database, "public", {
    Tables: {
        categories: {
            Row: {
                allowed_roles: string[];
                category_type: string;
                created_at: string;
                discord_category_id: string | null;
                guild_id: string;
                id: string;
                last_usage_at: string | null;
                name: string;
                settings: import("./generated/supabase").Json;
                total_seconds_in_category: number;
                updated_at: string;
            };
            Insert: {
                allowed_roles?: string[];
                category_type?: string;
                created_at?: string;
                discord_category_id?: string | null;
                guild_id: string;
                id?: string;
                last_usage_at?: string | null;
                name: string;
                settings?: import("./generated/supabase").Json;
                total_seconds_in_category?: number;
                updated_at?: string;
            };
            Update: {
                allowed_roles?: string[];
                category_type?: string;
                created_at?: string;
                discord_category_id?: string | null;
                guild_id?: string;
                id?: string;
                last_usage_at?: string | null;
                name?: string;
                settings?: import("./generated/supabase").Json;
                total_seconds_in_category?: number;
                updated_at?: string;
            };
            Relationships: [];
        };
        discord_sync: {
            Row: {
                data: import("./generated/supabase").Json;
                entity_type: string;
                guild_id: string;
                id: string;
                last_synced_at: string;
                sync_status: string;
            };
            Insert: {
                data: import("./generated/supabase").Json;
                entity_type: string;
                guild_id: string;
                id: string;
                last_synced_at?: string;
                sync_status?: string;
            };
            Update: {
                data?: import("./generated/supabase").Json;
                entity_type?: string;
                guild_id?: string;
                id?: string;
                last_synced_at?: string;
                sync_status?: string;
            };
            Relationships: [];
        };
        events: {
            Row: {
                created_at: string;
                entity_id: string;
                entity_type: string;
                event_type: string;
                id: string;
                payload: import("./generated/supabase").Json;
                processed: boolean;
            };
            Insert: {
                created_at?: string;
                entity_id: string;
                entity_type: string;
                event_type: string;
                id?: string;
                payload: import("./generated/supabase").Json;
                processed?: boolean;
            };
            Update: {
                created_at?: string;
                entity_id?: string;
                entity_type?: string;
                event_type?: string;
                id?: string;
                payload?: import("./generated/supabase").Json;
                processed?: boolean;
            };
            Relationships: [];
        };
        task_queue: {
            Row: {
                attempts: number;
                completed_at: string | null;
                created_at: string;
                error: string | null;
                id: string;
                max_attempts: number;
                payload: import("./generated/supabase").Json;
                priority: number;
                result: import("./generated/supabase").Json | null;
                scheduled_for: string;
                status: string;
                task_type: string;
                updated_at: string;
            };
            Insert: {
                attempts?: number;
                completed_at?: string | null;
                created_at?: string;
                error?: string | null;
                id?: string;
                max_attempts?: number;
                payload: import("./generated/supabase").Json;
                priority?: number;
                result?: import("./generated/supabase").Json | null;
                scheduled_for?: string;
                status?: string;
                task_type: string;
                updated_at?: string;
            };
            Update: {
                attempts?: number;
                completed_at?: string | null;
                created_at?: string;
                error?: string | null;
                id?: string;
                max_attempts?: number;
                payload?: import("./generated/supabase").Json;
                priority?: number;
                result?: import("./generated/supabase").Json | null;
                scheduled_for?: string;
                status?: string;
                task_type?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        zones: {
            Row: {
                category_id: string;
                created_at: string;
                discord_voice_id: string | null;
                id: string;
                last_usage_at: string | null;
                name: string;
                settings: import("./generated/supabase").Json;
                stats: import("./generated/supabase").Json;
                updated_at: string;
                zone_key: string;
            };
            Insert: {
                category_id: string;
                created_at?: string;
                discord_voice_id?: string | null;
                id?: string;
                last_usage_at?: string | null;
                name: string;
                settings?: import("./generated/supabase").Json;
                stats?: import("./generated/supabase").Json;
                updated_at?: string;
                zone_key: string;
            };
            Update: {
                category_id?: string;
                created_at?: string;
                discord_voice_id?: string | null;
                id?: string;
                last_usage_at?: string | null;
                name?: string;
                settings?: import("./generated/supabase").Json;
                stats?: import("./generated/supabase").Json;
                updated_at?: string;
                zone_key?: string;
            };
            Relationships: [{
                foreignKeyName: "zones_category_id_fkey";
                columns: ["category_id"];
                isOneToOne: false;
                referencedRelation: "categories";
                referencedColumns: ["id"];
            }];
        };
    };
    Views: {
        discord_channels: {
            Row: {
                guild_id: string | null;
                id: string | null;
                name: string | null;
                parent_id: string | null;
                type: string | null;
            };
            Insert: {
                guild_id?: string | null;
                id?: string | null;
                name?: never;
                parent_id?: never;
                type?: never;
            };
            Update: {
                guild_id?: string | null;
                id?: string | null;
                name?: never;
                parent_id?: never;
                type?: never;
            };
            Relationships: [];
        };
        discord_roles: {
            Row: {
                color: number | null;
                guild_id: string | null;
                id: string | null;
                is_hoist: boolean | null;
                name: string | null;
            };
            Insert: {
                color?: never;
                guild_id?: string | null;
                id?: string | null;
                is_hoist?: never;
                name?: never;
            };
            Update: {
                color?: never;
                guild_id?: string | null;
                id?: string | null;
                is_hoist?: never;
                name?: never;
            };
            Relationships: [];
        };
    };
    Functions: { [_ in never]: never; };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
}>;
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];
export type Category = Tables['categories']['Row'];
export type InsertCategory = Tables['categories']['Insert'];
export type UpdateCategory = Tables['categories']['Update'];
export type Zone = Tables['zones']['Row'];
export type InsertZone = Tables['zones']['Insert'];
export type UpdateZone = Tables['zones']['Update'];
export type DiscordSync = Tables['discord_sync']['Row'];
export type InsertDiscordSync = Tables['discord_sync']['Insert'];
export type UpdateDiscordSync = Tables['discord_sync']['Update'];
export type Event = Tables['events']['Row'];
export type InsertEvent = Tables['events']['Insert'];
export type UpdateEvent = Tables['events']['Update'];
export type TaskQueue = Tables['task_queue']['Row'];
export type InsertTaskQueue = Tables['task_queue']['Insert'];
export type UpdateTaskQueue = Tables['task_queue']['Update'];
export type CategoryWithZones = Category & {
    zones: Zone[];
};
