export * from './supabase';
export type { Json, Database } from './generated/supabase';
export * from './context';
export interface CategoryEvent {
    id: string;
    guildId: string;
    name: string;
    eventType: string | 'created' | 'updated' | 'deleted' | 'confirmation' | 'error';
    timestamp: string;
    discordCategoryId?: string;
    error?: string;
}
export interface ZoneEvent {
    id: string;
    categoryId: string;
    guildId: string;
    name: string;
    eventType: string | 'created' | 'updated' | 'deleted' | 'confirmation' | 'error';
    timestamp: string;
    discordChannelId?: string;
    error?: string;
}
export interface RoleEvent {
    id: string;
    guildId: string;
    name: string;
    eventType: string | 'created' | 'updated' | 'deleted' | 'confirmation' | 'error';
    timestamp: string;
    discordRoleId?: string;
    error?: string;
    color?: string;
}
export type { Category as GraphQLCategory, Zone as GraphQLZone, } from './generated/graph';
export * from './realtime';
