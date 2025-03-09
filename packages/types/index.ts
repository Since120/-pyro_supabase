// Export Supabase client und base types
export * from './supabase';

// Export generated Supabase types
// Wir exportieren nur bestimmte Typen aus der generierten supabase.ts,
// um Konflikte zu vermeiden
export type { Json, Database } from './generated/supabase';

// Export context type
export * from './context';

// Legacy Events für Redis PubSub (werden später während der vollständigen Migration entfernt)

// Legacy CategoryEvent für Redis PubSub
export interface CategoryEvent {
  id: string;
  guildId: string;
  name: string;
  // Erweitere den Typ, um alle möglichen Werte einzuschließen
  eventType: string | 'created' | 'updated' | 'deleted' | 'confirmation' | 'error';
  timestamp: string;
  discordCategoryId?: string;
  error?: string;
}

// Legacy ZoneEvent für Redis PubSub
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

// Legacy RoleEvent für Redis PubSub
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

// Export legacy GraphQL types for compatibility during migration
// Wir exportieren legacy GraphQL-Typen unter neuem Namen für Kompatibilität
export type { 
  Category as GraphQLCategory, 
  Zone as GraphQLZone, 
  // Füge hier alle weiteren Typen aus graph.ts hinzu, die du benötigst
} from './generated/graph';

// Achtung: Hier exportieren wir keine Typen mit *, da es zu Konflikten führen kann
// Stattdessen solltest du alle benötigten Typen explizit importieren und umbenennen

// Export realtime types (replacing PubSub)
export * from './realtime';