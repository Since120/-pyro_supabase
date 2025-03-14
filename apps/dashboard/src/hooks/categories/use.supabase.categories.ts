// apps/dashboard/src/hooks/categories/use.supabase.categories.ts
import { useState, useCallback } from 'react';
import { supabase, Json } from 'pyro-types';
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

    // Die Supabase realtime Konfiguration hat bestimmte Anforderungen an die Typen
    // Wir verwenden einfach die Standard-Optionen ohne spezielle Konfiguration
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
          
          // Debug-Ausgabe für bessere Nachvollziehbarkeit
          console.log('[useSupabaseCategories] Aktuelle Kategorien vor Update:', categories.length);
          
          // Behandlung je nach Event-Typ
          if (payload.eventType === 'INSERT') {
            console.log('[useSupabaseCategories] Neue Kategorie hinzugefügt, aktualisiere Liste');
            
            // WICHTIG: Bei INSERT immer die vollständige Liste neu laden
            // Dadurch vermeiden wir Probleme mit fehlenden Feldern oder Inkonsistenzen
            console.log('[useSupabaseCategories] Lade vollständige Kategorieliste neu nach INSERT');
            fetchCategories();
          } else if (payload.eventType === 'UPDATE') {
            console.log('[useSupabaseCategories] Kategorie aktualisiert, aktualisiere Liste');
            
            // Kategorie im State aktualisieren
            if (payload.new) {
              console.log('[useSupabaseCategories] Aktualisiere Kategorie:', payload.new.id, payload.new.name);
              setCategories(prev => prev.map(cat => 
                cat.id === payload.new.id ? payload.new : cat
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('[useSupabaseCategories] Kategorie gelöscht, aktualisiere Liste');
            
            // WICHTIG: Bei DELETE immer die vollständige Liste neu laden
            // So stellen wir sicher, dass auch andere abhängige Daten aktualisiert werden
            console.log('[useSupabaseCategories] Lade vollständige Kategorieliste neu nach DELETE');
            fetchCategories();
          }
          
          // Immer ein UI-Update triggern
          setRefreshTrigger(prev => prev + 1);
          
          // Debug-Log nach Update
          console.log('[useSupabaseCategories] Refresh-Trigger aktualisiert:', refreshTrigger);
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
  }, [fetchCategories, guildId, categories.length]);

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
      
      console.log('[useSupabaseCategories] Erstelle neue Kategorie mit Daten:', categoryData);
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('[useSupabaseCategories] Kategorie erfolgreich erstellt:', data?.id, data?.name);
      
      // Die Realtime-Events sollten automatisch dafür sorgen, dass die Kategorie im UI erscheint
      // Wir aktualisieren den Trigger dennoch, um einen Fallback zu haben
      setRefreshTrigger(prev => {
        console.log('[useSupabaseCategories] Erhöhe Refresh-Trigger nach Erstellung:', prev + 1);
        return prev + 1;
      });
      
      return data;
    } catch (err: any) {
      console.error('[useSupabaseCategories] Fehler beim Erstellen der Kategorie:', err);
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
    if (!guildId || !categoryId) {
      console.error('[useSupabaseCategories] updateCategory: Keine gültige guildId oder categoryId:', { guildId, categoryId });
      return null;
    }
    
    console.log('[useSupabaseCategories] updateCategory: Starte Update für Kategorie:', { 
      categoryId, 
      guildId,
      updateData 
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Bereite das Update-Objekt vor
      const dbUpdateData: Record<string, any> = { ...updateData };
      
      // Entferne direkte Referenzen zu Feldern, die jetzt in settings sind
      const { is_visible, is_tracking_active, is_send_setup, settings, ...otherFields } = dbUpdateData;
      
      console.log('[useSupabaseCategories] Extrahierte Felder:', { 
        is_visible, 
        is_tracking_active, 
        is_send_setup, 
        settings, 
        otherFields 
      });
      
      // Erstelle das finale Update-Objekt
      const finalUpdateData: Record<string, any> = { ...otherFields };
      
      // Wenn eines der settings-Felder aktualisiert werden soll, 
      // müssen wir zuerst die aktuellen Einstellungen holen und dann aktualisieren
      if (is_visible !== undefined || is_tracking_active !== undefined || is_send_setup !== undefined || settings !== undefined) {
        console.log('[useSupabaseCategories] Settings müssen aktualisiert werden, hole aktuelle Daten...');
        
        // Hole die aktuellen Einstellungen
        const { data: currentData, error: fetchError } = await supabase
          .from('categories')
          .select('settings')
          .eq('id', categoryId)
          .single();
        
        if (fetchError) {
          console.error('[useSupabaseCategories] Fehler beim Abrufen der aktuellen Einstellungen:', fetchError);
          throw fetchError;
        }
        
        console.log('[useSupabaseCategories] Aktuelle Kategorie-Daten:', currentData);
          
        // Aktualisiere die Einstellungen
        let currentSettings: Record<string, any> = {};
        
        // Sicherer Umgang mit den Settings
        if (currentData?.settings && 
            typeof currentData.settings === 'object' && 
            currentData.settings !== null &&
            !Array.isArray(currentData.settings)) {
          currentSettings = currentData.settings as Record<string, any>;
          console.log('[useSupabaseCategories] Aktuelle Settings gefunden:', currentSettings);
        } else {
          console.warn('[useSupabaseCategories] Keine gültigen settings in der Datenbank gefunden:', currentData?.settings);
        }
        
        // Sicherer Umgang mit den neuen Settings
        let settingsToApply: Record<string, any> = {};
        if (settings && 
            typeof settings === 'object' && 
            settings !== null &&
            !Array.isArray(settings)) {
          settingsToApply = settings as Record<string, any>;
          console.log('[useSupabaseCategories] Neue settings zur Anwendung:', settingsToApply);
        }
        
        // Konstruiere die aktualisierten Settings manuell
        const updatedSettings: Record<string, any> = { ...currentSettings };
        
        // Füge die neuen Settings hinzu
        Object.keys(settingsToApply).forEach(key => {
          updatedSettings[key] = settingsToApply[key];
        });
        
        // Füge die zusätzlichen Einstellungen hinzu
        if (is_visible !== undefined) updatedSettings.is_visible = is_visible;
        if (is_tracking_active !== undefined) updatedSettings.is_tracking_active = is_tracking_active;
        if (is_send_setup !== undefined) updatedSettings.is_send_setup = is_send_setup;
        
        console.log('[useSupabaseCategories] Finale aktualisierte Settings:', updatedSettings);
        
        // Füge das aktualisierte settings-Objekt zum Update hinzu
        finalUpdateData.settings = updatedSettings;
      }
      
      console.log('[useSupabaseCategories] Finales Update-Objekt:', finalUpdateData);
      
      // Füge eine Spalte hinzu, die dafür sorgt, dass ein Update-Event ausgelöst wird
      finalUpdateData.updated_at = new Date().toISOString();
      
      // Stelle sicher, dass die direkten Spalten (nicht nur settings) aktualisiert werden
      if (is_visible !== undefined) {
        finalUpdateData.is_visible = is_visible;
        console.log('[useSupabaseCategories] Direktes Feld is_visible wird gesetzt auf:', is_visible);
      }
      
      if (is_tracking_active !== undefined) {
        finalUpdateData.is_tracking_active = is_tracking_active;
        console.log('[useSupabaseCategories] Direktes Feld is_tracking_active wird gesetzt auf:', is_tracking_active);
      }
      
      if (is_send_setup !== undefined) {
        finalUpdateData.is_send_setup = is_send_setup;
        console.log('[useSupabaseCategories] Direktes Feld is_send_setup wird gesetzt auf:', is_send_setup);
      }
      
      // Führe das Update durch
      console.log('[useSupabaseCategories] Sende endgültiges Update an Supabase:', JSON.stringify(finalUpdateData, null, 2));
      
      const { data, error } = await supabase
        .from('categories')
        .update(finalUpdateData)
        .eq('id', categoryId)
        .eq('guild_id', guildId) // Sicherheitsmaßnahme
        .select()
        .single();
        
      if (error) {
        console.error('[useSupabaseCategories] Fehler beim Update in Supabase:', error);
        throw error;
      }
      
      console.log('[useSupabaseCategories] Kategorie erfolgreich aktualisiert:', data);
      
      // ENTFERNT: Keine direkte Benachrichtigung mehr zeigen
      // Die Benachrichtigung kommt später vom Discord-Bot
      
      // Aktualisiere den Trigger, um sicherzustellen, dass die UI auch ohne Realtime-Events aktualisiert wird
      setRefreshTrigger(prev => {
        console.log('[useSupabaseCategories] Erhöhe Refresh-Trigger nach Aktualisierung:', prev + 1);
        return prev + 1;
      });
      
      return data;
    } catch (err: any) {
      console.error('[useSupabaseCategories] Fehler beim Aktualisieren der Kategorie:', err);
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

  /**
   * Kategorie löschen - direkte Löschung ohne Umweg über discord_sync
   */
  const deleteCategory = useCallback(async (categoryId: string, eventOptions?: any) => {
    if (!guildId || !categoryId) {
      console.error('[useSupabaseCategories] deleteCategory: Keine gültige guildId oder categoryId:', { guildId, categoryId });
      return null;
    }
    
    console.log('[useSupabaseCategories] deleteCategory: Starte vereinfachte Löschung für Kategorie:', { 
      categoryId, 
      guildId,
      eventOptions 
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Hole zuerst die vollständigen Kategorie-Informationen
      console.log(`[useSupabaseCategories] Hole Kategorie-Informationen für ID ${categoryId}...`);
      const { data: categoryData, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
        
      if (fetchError) {
        console.error('[useSupabaseCategories] Fehler beim Abrufen der Kategorie:', fetchError);
        throw fetchError;
      }
      
      if (!categoryData) {
        console.error(`[useSupabaseCategories] Kategorie mit ID ${categoryId} nicht gefunden`);
        throw new Error(`Kategorie mit ID ${categoryId} nicht gefunden`);
      }
      
      console.log(`[useSupabaseCategories] Kategorie-Informationen für Löschung:`, categoryData);
      
      // 1. Zuerst aktualisieren wir die Kategorie und markieren sie als gelöscht
      console.log(`[useSupabaseCategories] Markiere Kategorie als gelöscht in Discord...`);
      
      // Bereite die Update-Daten vor
      const updateData = {
        is_deleted_in_discord: true,
        updated_at: new Date().toISOString()
      };
      
      // Führe das Update durch
      const { data: updateResult, error: updateError } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .eq('guild_id', guildId)
        .select();
      
      if (updateError) {
        console.error('[useSupabaseCategories] Fehler beim Markieren der Kategorie als gelöscht:', updateError);
        throw updateError;
      }
      
      console.log('[useSupabaseCategories] Kategorie erfolgreich als gelöscht markiert:', updateResult);
      
      // Warte eine Sekunde, damit der Bot die Änderung erfassen kann
      console.log('[useSupabaseCategories] Warte 1 Sekunde, damit der Bot die Änderung erfassen kann...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. Jetzt löschen wir die Kategorie aus der Datenbank
      console.log(`[useSupabaseCategories] Lösche Kategorie mit ID ${categoryId} aus der Datenbank...`);
      const { data: deleteResult, error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .select();
      
      if (deleteError) {
        console.error('[useSupabaseCategories] Fehler beim Löschen der Kategorie aus der Datenbank:', deleteError);
        throw deleteError;
      }
      
      console.log('[useSupabaseCategories] Kategorie erfolgreich aus der Datenbank gelöscht:', deleteResult);
      
      // Aktualisiere den Trigger, um sicherzustellen, dass die UI auch ohne Realtime-Events aktualisiert wird
      setRefreshTrigger(prev => {
        console.log('[useSupabaseCategories] Erhöhe Refresh-Trigger nach Löschung:', prev + 1);
        return prev + 1;
      });
      
      // Die Kategorie direkt aus dem lokalen State entfernen
      setCategories(prev => {
        console.log('[useSupabaseCategories] Entferne Kategorie aus lokalem State:', categoryId);
        return prev.filter(cat => cat.id !== categoryId);
      });
      
      // ENTFERNT: Keine direkte Benachrichtigung mehr anzeigen
      // Die Benachrichtigung kommt später vom Discord-Bot nach erfolgreicher Löschung
      
      return { success: true, categoryData };
    } catch (err: any) {
      console.error('[useSupabaseCategories] Fehler beim Löschen der Kategorie:', err);
      setError(err);
      enqueueSnackbar(
        `Fehler beim Löschen der Kategorie: ${err.message}`, 
        { variant: 'error' }
      );
      return null;
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