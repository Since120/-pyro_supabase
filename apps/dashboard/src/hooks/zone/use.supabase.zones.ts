// apps/dashboard/src/hooks/zone/use.supabase.zones.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase, realtimeManager } from 'pyro-types';
import { useSnackbar } from 'notistack';
import { Zone, CreateZoneInput, UpdateZoneInput } from '../../types/zone.types';

// Supabase Datenbankschema für Zonen
interface SupabaseZoneRow {
  id: string;
  name: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  zone_key: string;
  discord_voice_id: string | null;
  last_usage_at: string | null;
  settings: any;
  stats: any;
}

// Für Supabase Insert-Operation erforderliche Felder
interface SupabaseZoneInsert {
  name: string;
  category_id: string;
  zone_key: string;
  settings: any;
}

/**
 * Konvertiert eine Zone-Zeile aus Supabase in unser Zone-Modell
 */
function mapSupabaseZoneToModel(row: SupabaseZoneRow): Zone {
  // Analysiere settings und stats JSON-Felder
  const settings = typeof row.settings === 'string' 
    ? JSON.parse(row.settings) 
    : (row.settings || {});
    
  const stats = typeof row.stats === 'string' 
    ? JSON.parse(row.stats) 
    : (row.stats || {});
  
  // Extrahiere relevante Daten aus settings oder verwende Standardwerte
  return {
    id: row.id,
    name: row.name,
    server_id: settings.server_id || '',
    category_id: row.category_id || '',
    zone_type: settings.zone_type || 'voice',
    allowed_roles: settings.allowed_roles || [],
    is_private: !!settings.is_private,
    is_visible: settings.is_visible !== false, // Standard: true
    is_moderated: !!settings.is_moderated,
    is_tracking_enabled: !!settings.is_tracking_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
    discord_id: row.discord_voice_id || undefined,
    discord_position: settings.discord_position
  };
}

/**
 * Konvertiert unser Zone-Modell in ein Format für Supabase
 */
function mapZoneModelToSupabase(zone: CreateZoneInput): SupabaseZoneInsert {
  // Extrahiere Basis-Felder
  const { name, category_id } = zone;
  
  // Packe die restlichen Felder in settings
  const settings = {
    server_id: zone.server_id,
    zone_type: zone.zone_type,
    allowed_roles: zone.allowed_roles,
    is_private: zone.is_private,
    is_visible: zone.is_visible,
    is_moderated: zone.is_moderated,
    is_tracking_enabled: zone.is_tracking_enabled,
    discord_position: zone.discord_position
  };
  
  // Generiere einen eindeutigen zone_key (kann später angepasst werden)
  const zone_key = `zone-${Date.now()}`;
  
  return {
    name,
    category_id,
    zone_key,
    settings
  };
}

/**
 * Hook für die Verwaltung von Zonen mit Supabase
 */
export const useSupabaseZones = (guildId: string = '') => {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);

  /**
   * Alle Zonen abrufen
   */
  const fetchZones = useCallback(async (serverId?: string) => {
    const targetServerId = serverId || guildId;
    
    if (!targetServerId) {
      console.warn('Kein Server ID angegeben. Zonen können nicht abgerufen werden.');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*');
      
      if (error) throw new Error(error.message);
      
      // Konvertiere die Daten und filtere nach server_id, die in settings gespeichert ist
      const mappedZones = (data as SupabaseZoneRow[])
        .map(mapSupabaseZoneToModel)
        .filter(zone => zone.server_id === targetServerId);
      
      setZones(mappedZones);
      return mappedZones;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Fehler beim Abrufen der Zonen:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  /**
   * Eine Zone anhand ihrer ID abrufen
   */
  const getZoneById = useCallback(async (zoneId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('id', zoneId)
        .single();
      
      if (error) throw new Error(error.message);
      
      return mapSupabaseZoneToModel(data as SupabaseZoneRow);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Fehler beim Abrufen der Zone:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Eine neue Zone erstellen
   */
  const createZone = useCallback(async (input: CreateZoneInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stellen Sie sicher, dass die server_id übergeben wird
      if (!guildId && !input.server_id) {
        throw new Error('Server ID ist erforderlich');
      }
      
      const zoneData = {
        ...input,
        server_id: input.server_id || guildId,
      };
      
      // Konvertiere in Supabase-Struktur
      const supabaseData: SupabaseZoneInsert = mapZoneModelToSupabase(zoneData);
      
      const { data, error } = await supabase
        .from('zones')
        .insert([supabaseData])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      // Konvertiere zurück in unser Modell
      const newZone = mapSupabaseZoneToModel(data as SupabaseZoneRow);
      
      // Aktualisiere den internen State
      setZones(prev => [...prev, newZone]);
      
      return newZone;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Fehler beim Erstellen der Zone:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  /**
   * Eine bestehende Zone aktualisieren
   */
  const updateZone = useCallback(async (id: string, updates: UpdateZoneInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Hole aktuelle Zone, um eine vollständige Aktualisierung durchzuführen
      const currentZone = await getZoneById(id);
      
      if (!currentZone) {
        throw new Error(`Zone mit ID ${id} nicht gefunden`);
      }
      
      // Hole die Zeile aus Supabase, um die aktuellen settings zu bekommen
      const { data: rowData, error: rowError } = await supabase
        .from('zones')
        .select('*')
        .eq('id', id)
        .single();
        
      if (rowError) throw new Error(rowError.message);
      
      // Aktualisiere settings in Supabase
      const row = rowData as SupabaseZoneRow;
      const currentSettings = typeof row.settings === 'string' 
        ? JSON.parse(row.settings) 
        : (row.settings || {});
      
      // Neue settings erstellen mit den Updates
      const newSettings = {
        ...currentSettings,
        zone_type: updates.zone_type,
        allowed_roles: updates.allowed_roles,
        is_private: updates.is_private,
        is_visible: updates.is_visible,
        is_moderated: updates.is_moderated,
        is_tracking_enabled: updates.is_tracking_enabled,
        discord_position: updates.discord_position
      };
      
      // Bereite Daten für Update vor
      const updateData: any = {};
      
      // Nur nicht-undefined Werte aktualisieren
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
      
      // Settings immer aktualisieren
      updateData.settings = newSettings;
      
      const { data, error } = await supabase
        .from('zones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      // Konvertiere zurück in unser Modell
      const updatedZone = mapSupabaseZoneToModel(data as SupabaseZoneRow);
      
      // Aktualisiere den internen State
      setZones(prev => prev.map(zone => zone.id === id ? updatedZone : zone));
      
      return updatedZone;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Fehler beim Aktualisieren der Zone:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getZoneById]);

  /**
   * Eine Zone löschen
   */
  const deleteZone = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Aktualisiere den internen State
      setZones(prev => prev.filter(zone => zone.id !== id));
      
      return { success: true, id };
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Fehler beim Löschen der Zone:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Echtzeit-Aktualisierungen einrichten
   */
  useEffect(() => {
    if (!guildId) return;
    
    // Initial zones laden
    fetchZones();
    
    // Realtime-Subscription für Zonen-Updates
    const subscription = supabase
      .channel('zones-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'zones' 
      }, (payload) => {
        console.log('Zones change received:', payload);
        
        // Zonen neu laden, wenn sich etwas ändert
        fetchZones();
      })
      .subscribe();
    
    // Cleanup Subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [guildId, fetchZones]);

  return {
    zones,
    isLoading,
    error,
    fetchZones,
    getZoneById,
    createZone,
    updateZone,
    deleteZone
  };
};

export type { SupabaseZoneRow };
