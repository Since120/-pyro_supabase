// apps/dashboard/src/hooks/categories/use.supabase.categories.ts
import { useState, useCallback } from 'react';
import { supabase } from 'pyro-types';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type CategoryFormData = {
  name: string;
  category_type: string;
  allowed_roles: string[];
  is_visible?: boolean;
  is_tracking_active?: boolean;
  is_send_setup?: boolean;
};

type UpdateCategoryData = {
  name?: string;
  category_type?: string;
  allowed_roles?: string[];
  is_visible?: boolean;
  is_tracking_active?: boolean;
  is_send_setup?: boolean;
  settings?: Record<string, any>;
};

/**
 * Hook für die Verwaltung von Kategorien mit Supabase
 */
export const useSupabaseCategories = (guildId: string) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Kategorien laden
  const fetchCategories = useCallback(async () => {
    if (!guildId) return;
    
    console.log('[useSupabaseCategories] Lade Kategorien...');
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('guild_id', guildId);
        
      if (error) throw error;
      
      console.log('[useSupabaseCategories] Kategorien geladen:', data?.length || 0);
      setCategories(data || []);
      // Kein automatisches Refresh-Triggern hier
    } catch (err: any) {
      setError(err);
      console.error('[useSupabaseCategories] Fehler beim Laden der Kategorien:', err);
      enqueueSnackbar(
        `Fehler beim Laden der Kategorien: ${err.message}`, 
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);

  // Kategorien bei Komponentenmontage laden und bei Realtime-Updates aktualisieren
  useEffect(() => {
    // Lade Kategorien beim Mounten
    fetchCategories();

    // Direkter Supabase Realtime-Channel
    const channelName = `categories-realtime-${guildId}`;
    console.log(`[useSupabaseCategories] Erstelle Supabase-Kanal: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Alle Event-Typen (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'categories',
          filter: `guild_id=eq.${guildId}`  // Nur Events für diese Guild
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[useSupabaseCategories] Categories Realtime-Event empfangen:`, payload);
          
          // Behandlung je nach Event-Typ
          if (payload.eventType === 'INSERT') {
            console.log('[useSupabaseCategories] Neue Kategorie hinzugefügt, aktualisiere Liste');
            
            // Direkt zum State hinzufügen, ohne serverseitige Abfrage
            if (payload.new) {
              setCategories(prev => [...prev, payload.new]);
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('[useSupabaseCategories] Kategorie aktualisiert, aktualisiere Liste');
            
            // Kategorie im State aktualisieren
            if (payload.old && payload.new) {
              setCategories(prev => prev.map(cat => 
                cat.id === payload.old.id ? payload.new : cat
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('[useSupabaseCategories] Kategorie gelöscht, aktualisiere Liste');
            
            // Kategorie aus State entfernen
            if (payload.old) {
              setCategories(prev => prev.filter(cat => cat.id !== payload.old.id));
            }
          }
          
          // Immer ein UI-Update triggern
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log(`[useSupabaseCategories] Kanal '${channelName}' Status: ${status}`);
      });

    // Cleanup beim Unmounten
    return () => {
      console.log(`[useSupabaseCategories] Cleanup Supabase Realtime-Subscription`);
      channel.unsubscribe();
    };
  }, [fetchCategories, guildId, refreshTrigger]);

  // Kategorie erstellen
  const createCategory = useCallback(async (formData: CategoryFormData) => {
    if (!guildId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Bereite Daten für Supabase vor
      const categoryData = {
        guild_id: guildId,
        name: formData.name,
        category_type: formData.category_type,
        allowed_roles: formData.allowed_roles,
        settings: {
          is_visible: formData.is_visible ?? true,
          is_tracking_active: formData.is_tracking_active ?? false,
          is_send_setup: formData.is_send_setup ?? false,
          is_deleted_in_discord: false
        },
        // Die folgenden Felder werden automatisch von Supabase gesetzt
        // created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Keine sofortige Benachrichtigung mehr
      // Die Benachrichtigung kommt erst, wenn Discord die Kategorie erstellt hat
      
      // Aktualisiere die Liste der Kategorien
      setRefreshTrigger(prev => prev + 1);
      
      return data;
    } catch (err: any) {
      setError(err);
      enqueueSnackbar(
        `Fehler beim Erstellen der Kategorie: ${err.message}`, 
        { variant: 'error' }
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);

  // Kategorie aktualisieren
  const updateCategory = useCallback(async (categoryId: string, updateData: UpdateCategoryData) => {
    if (!guildId || !categoryId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Bereite das Update-Objekt vor
      const dbUpdateData: Record<string, any> = { ...updateData };
      
      // Entferne direkte Referenzen zu Feldern, die jetzt in settings sind
      const { is_visible, is_tracking_active, is_send_setup, settings, ...otherFields } = dbUpdateData;
      
      // Erstelle das finale Update-Objekt
      const finalUpdateData: Record<string, any> = { ...otherFields };
      
      // Wenn eines der settings-Felder aktualisiert werden soll, 
      // müssen wir zuerst die aktuellen Einstellungen holen und dann aktualisieren
      if (is_visible !== undefined || is_tracking_active !== undefined || is_send_setup !== undefined || settings !== undefined) {
        // Hole die aktuellen Einstellungen
        const { data: currentData } = await supabase
          .from('categories')
          .select('settings')
          .eq('id', categoryId)
          .single();
          
        // Aktualisiere die Einstellungen
        const currentSettings = currentData?.settings || {};
        const updatedSettings = {
          ...currentSettings,
          // Überprüfe, ob settings ein Objekt ist, bevor wir es spreaden
          ...(settings && typeof settings === 'object' ? settings : {}),
          ...(is_visible !== undefined ? { is_visible } : {}),
          ...(is_tracking_active !== undefined ? { is_tracking_active } : {}),
          ...(is_send_setup !== undefined ? { is_send_setup } : {})
        };
        
        // Füge das aktualisierte settings-Objekt zum Update hinzu
        finalUpdateData.settings = updatedSettings;
      }
      
      // Führe das Update durch
      const { data, error } = await supabase
        .from('categories')
        .update(finalUpdateData)
        .eq('id', categoryId)
        .eq('guild_id', guildId) // Sicherheitsmaßnahme
        .select()
        .single();
        
      if (error) throw error;
      
      enqueueSnackbar(
        `Kategorie "${data.name}" wurde aktualisiert.`, 
        { variant: 'success' }
      );
      
      // Aktualisiere die Liste der Kategorien
      setRefreshTrigger(prev => prev + 1);
      
      return data;
    } catch (err: any) {
      setError(err);
      enqueueSnackbar(
        `Fehler beim Aktualisieren der Kategorie: ${err.message}`, 
        { variant: 'error' }
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);

  // Kategorie löschen
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!guildId || !categoryId) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Hole zuerst die Kategorie-Informationen für die Bestätigungsnachricht
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();
        
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('guild_id', guildId); // Sicherheitsmaßnahme
        
      if (error) throw error;
      
      enqueueSnackbar(
        `Kategorie "${categoryData?.name || 'Unbekannt'}" wurde gelöscht.`, 
        { variant: 'success' }
      );
      
      // Aktualisiere die Liste der Kategorien
      setRefreshTrigger(prev => prev + 1);
      
      return true;
    } catch (err: any) {
      setError(err);
      enqueueSnackbar(
        `Fehler beim Löschen der Kategorie: ${err.message}`, 
        { variant: 'error' }
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories, // Füge fetchCategories als öffentliche Methode hinzu
    refreshTrigger,
    setRefreshTrigger
  };
};
