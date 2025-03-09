import { createClient } from '@supabase/supabase-js';
import type { Database } from './generated/supabase';

// These can be replaced with environment variables in a real implementation
const SUPABASE_URL = 'https://gselexnbubrinvzhcwrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWxleG5idWJyaW52emhjd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTI4NjcsImV4cCI6MjA1NjY4ODg2N30.kss9h2HyI8eiaIfYeTkD-I0t1S3GBBNzS2PXlRQ6eeg';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types exports
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums']; 

// Categories
export type Category = Tables['categories']['Row'];
export type InsertCategory = Tables['categories']['Insert'];
export type UpdateCategory = Tables['categories']['Update'];

// Zones
export type Zone = Tables['zones']['Row'];
export type InsertZone = Tables['zones']['Insert'];
export type UpdateZone = Tables['zones']['Update'];

// Discord Sync
export type DiscordSync = Tables['discord_sync']['Row'];
export type InsertDiscordSync = Tables['discord_sync']['Insert'];
export type UpdateDiscordSync = Tables['discord_sync']['Update'];

// Events
export type Event = Tables['events']['Row'];
export type InsertEvent = Tables['events']['Insert'];
export type UpdateEvent = Tables['events']['Update'];

// Task Queue
export type TaskQueue = Tables['task_queue']['Row'];
export type InsertTaskQueue = Tables['task_queue']['Insert'];
export type UpdateTaskQueue = Tables['task_queue']['Update'];

// React-specific types (for dashboard)
export type CategoryWithZones = Category & { zones: Zone[] };