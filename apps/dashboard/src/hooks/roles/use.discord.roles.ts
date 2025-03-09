// apps/dashboard/src/hooks/roles/use.discord.roles.ts
import { useSupabaseRoles } from './use.supabase.roles';

export const useDiscordRoles = () => {
  // Verwende den neuen Supabase-basierten Hook
  return useSupabaseRoles();
};