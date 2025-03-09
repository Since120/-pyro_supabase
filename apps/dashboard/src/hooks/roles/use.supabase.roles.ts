// apps/dashboard/src/hooks/roles/use.supabase.roles.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase, realtimeManager } from 'pyro-types';
import { useSnackbar } from 'notistack';
import { DiscordRole, DiscordRoleFilter } from '../../types';
import { useGuildContext } from '../guild/use.guild.context';

interface UseDiscordRolesResult {
  loading: boolean;
  error: Error | null;
  data?: {
    discordRoles: DiscordRole[];
  };
  refetch: (guildId?: string, filter?: DiscordRoleFilter) => Promise<DiscordRole[]>;
}

/**
 * Hook zum Abrufen von Discord-Rollen aus Supabase
 */
export const useSupabaseRoles = (): UseDiscordRolesResult => {
  const { enqueueSnackbar } = useSnackbar();
  const { guildId } = useGuildContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Holt Discord-Rollen aus Supabase über die discord_sync Tabelle
   */
  const fetchRoles = useCallback(async (
    targetGuildId: string = guildId,
    filter?: DiscordRoleFilter
  ): Promise<DiscordRole[]> => {
    // Fallback: Verwenden der Umgebungsvariable, wenn keine Guild ID angegeben ist
    const effectiveGuildId = targetGuildId || process.env.NEXT_PUBLIC_GUILD_ID;
    
    if (!effectiveGuildId) {
      console.warn('Kein Guild ID angegeben und keine Fallback-ID in NEXT_PUBLIC_GUILD_ID gefunden.');
      return [];
    }

    console.log(`Lade Rollen für Guild ${effectiveGuildId}...`);
    setLoading(true);
    setError(null);

    try {
      // Abfrage über die discord_sync Tabelle für Rollen
      let query = supabase
        .from('discord_sync')
        .select('*')
        .eq('guild_id', effectiveGuildId)
        .eq('entity_type', 'role');

      // Filter anwenden, falls vorhanden
      if (filter) {
        // Für name müssen wir in den JSON-Daten suchen
        if (filter.name) {
          query = query.ilike('data->>name', `%${filter.name}%`);
        }
        
        // Für is_managed müssen wir ebenfalls in den JSON-Daten suchen
        if (filter.isManaged !== undefined) {
          query = query.eq('data->>is_managed', filter.isManaged.toString());
        }
        
        // Für is_mentionable müssen wir ebenfalls in den JSON-Daten suchen
        if (filter.isMentionable !== undefined) {
          query = query.eq('data->>is_mentionable', filter.isMentionable.toString());
        }
      }

      console.log('Sende Anfrage an Supabase...');
      const { data, error } = await query;

      if (error) throw new Error(error.message);

      console.log(`${data?.length || 0} Rollen gefunden in discord_sync Tabelle`);
      
      // Daten aus der discord_sync Tabelle in unser DiscordRole-Format konvertieren
      const mappedRoles: DiscordRole[] = [];
      
      for (const row of data || []) {
        try {
          const roleData = row.data as any;
          
          // Prüfen, ob die Rolle gültige Daten enthält
          if (!roleData || !row.id) {
            console.warn('Ungültige Rollendaten übersprungen:', row);
            continue;
          }
          
          mappedRoles.push({
            id: row.id,
            name: roleData.name || `Rolle ${row.id}`,
            color: roleData.color || 0,
            isHoist: Boolean(roleData.is_hoist),
            position: roleData.position || 0,
            permissions: roleData.permissions || '',
            isManaged: Boolean(roleData.is_managed),
            isMentionable: Boolean(roleData.is_mentionable),
            icon: roleData.icon || null,
            unicodeEmoji: roleData.unicode_emoji || null,
            createdTimestamp: roleData.created_timestamp || Date.now(),
            createdAt: roleData.created_at || new Date().toISOString(),
            tags: roleData.role_tags ? {
              botId: roleData.role_tags.bot_id || null,
              isPremiumSubscriberRole: Boolean(roleData.role_tags.is_premium_subscriber_role),
              integrationId: roleData.role_tags.integration_id || null
            } : null
          });
        } catch (err) {
          console.error('Fehler beim Konvertieren der Rollendaten:', err, row);
        }
      }

      console.log(`${mappedRoles.length} Rollen erfolgreich konvertiert`);

      // Nach Position sortieren (höhere Position = wichtigere Rolle)
      mappedRoles.sort((a, b) => b.position - a.position);

      setRoles(mappedRoles);
      return mappedRoles;
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Fehler beim Abrufen der Discord-Rollen:', err);
      enqueueSnackbar(`Fehler beim Laden der Rollen: ${errorObj.message}`, { 
        variant: 'error' 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [guildId, enqueueSnackbar]);

  // Überwachen von Änderungen an der discord_sync Tabelle für Rollen
  useEffect(() => {
    if (!guildId) return;

    // Setup Realtime Subscription für discord_sync Tabelle (Rollen)
    const channel = supabase
      .channel(`discord_roles_${guildId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Alle Ereignisse (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'discord_sync',
          filter: `guild_id=eq.${guildId} AND entity_type=eq.role`
        },
        (payload) => {
          console.log('Rollenänderung erkannt:', payload);
          // Rollen bei jeder Änderung neu laden
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    // Rollen initial laden
    fetchRoles(guildId);

    // Cleanup beim Unmounten
    return () => {
      supabase.removeChannel(channel);
    };
  }, [guildId, fetchRoles]);

  // Bei Änderungen am Refresh-Trigger Rollen neu laden
  useEffect(() => {
    if (guildId) {
      fetchRoles(guildId);
    }
  }, [refreshTrigger, guildId, fetchRoles]);

  return {
    loading,
    error,
    data: { discordRoles: roles },
    refetch: fetchRoles
  };
};
