// apps/dashboard/src/hooks/categories/use.update.category.ts
import { useState, useCallback } from 'react';
import { supabase } from 'pyro-types';
import { useSnackbar } from 'notistack';
import { useGuildContext } from '../guild/use.guild.context';

type UpdateCategoryData = {
  name?: string;
  category_type?: string;
  allowed_roles?: string[];
  is_visible?: boolean;
  is_tracking_active?: boolean;
  is_send_setup?: boolean;
  settings?: Record<string, any>;
};

// Typ für die Settings definieren
type CategorySettings = {
  is_visible?: boolean;
  is_tracking_active?: boolean;
  is_send_setup?: boolean;
  is_deleted_in_discord?: boolean;
  process_via_queue?: boolean;
  [key: string]: any; // Für andere mögliche Eigenschaften
};

export function useUpdateCategory() {
  const { guildId } = useGuildContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const updateCategory = useCallback(async (categoryId: string, updateData: UpdateCategoryData) => {
    if (!guildId || !categoryId) {
      console.error('[useUpdateCategory] Keine gültige guildId oder categoryId');
      enqueueSnackbar('Keine gültige Guild ID oder Kategorie ID', { variant: 'error' });
      return null;
    }
    
    console.log('[useUpdateCategory] Starte Update für Kategorie:', categoryId);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // WICHTIG: Prüfen, ob sich der Name ändert - hierfür brauchen wir die aktuelle Kategorie
      let currentCategory;
      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('name, settings')
          .eq('id', categoryId)
          .single();
          
        if (fetchError) {
          throw fetchError;
        }
        
        currentCategory = data;
        console.log('[useUpdateCategory] Aktuelle Kategorie geladen:', currentCategory);
      } catch (err: any) {
        console.error('[useUpdateCategory] Fehler beim Abrufen der Kategorie:', err);
        enqueueSnackbar(`Fehler beim Abrufen der Kategorie: ${err.message || 'Unbekannter Fehler'}`, { variant: 'error' });
        setIsLoading(false);
        return null;
      }
      
      // Prüfen, ob eine Namensänderung vorliegt
      const hasNameChange = Boolean(updateData.name && updateData.name !== currentCategory.name);
      console.log(`[useUpdateCategory] Namensänderung erkannt:`, hasNameChange);
      
      // Vereinfachtes Update-Objekt erstellen
      const updateObj: Record<string, any> = {};
      
      // Nur die notwendigen Felder hinzufügen
      if (updateData.name) updateObj.name = updateData.name;
      if (updateData.category_type) updateObj.category_type = updateData.category_type;
      if (updateData.allowed_roles) updateObj.allowed_roles = updateData.allowed_roles;
      if (updateData.is_visible !== undefined) updateObj.is_visible = updateData.is_visible;
      if (updateData.is_tracking_active !== undefined) updateObj.is_tracking_active = updateData.is_tracking_active;
      if (updateData.is_send_setup !== undefined) updateObj.is_send_setup = updateData.is_send_setup;
      
      // Settings separat behandeln
      try {
        // Aktuelle settings extrahieren (sicherer Weg)
        let currentSettings: CategorySettings = {};
        if (currentCategory.settings) {
          // Wenn settings ein String ist, versuchen zu parsen
          if (typeof currentCategory.settings === 'string') {
            try {
              currentSettings = JSON.parse(currentCategory.settings) as CategorySettings;
            } catch (e) {
              console.warn('[useUpdateCategory] Settings konnten nicht geparst werden:', e);
              // Bei Fehler leeres Objekt verwenden
              currentSettings = {};
            }
          } 
          // Wenn es ein Objekt ist, direkt verwenden
          else if (typeof currentCategory.settings === 'object') {
            currentSettings = { ...currentCategory.settings } as CategorySettings;
          }
        }
        
        // Neue settings erstellen
        const newSettings: CategorySettings = { ...currentSettings };
        
        // Neue einstellungen aus updateData übernehmen
        if (updateData.settings && typeof updateData.settings === 'object') {
          Object.assign(newSettings, updateData.settings);
        }
        
        // Direkten Feldern in settings
        if (updateData.is_visible !== undefined) newSettings.is_visible = updateData.is_visible;
        if (updateData.is_tracking_active !== undefined) newSettings.is_tracking_active = updateData.is_tracking_active;
        if (updateData.is_send_setup !== undefined) newSettings.is_send_setup = updateData.is_send_setup;
        
        // Flag für Queue-Verarbeitung setzen
        newSettings.process_via_queue = hasNameChange;
        
        // Settings zum Update-Objekt hinzufügen
        updateObj.settings = newSettings;
        
        console.log('[useUpdateCategory] Finales settings-Objekt:', newSettings);
      } catch (settingsErr: any) {
        console.error('[useUpdateCategory] Fehler bei der Settings-Verarbeitung:', settingsErr);
        // Trotz Fehler ein minimales Settings-Objekt mit dem Queue-Flag erstellen
        updateObj.settings = { process_via_queue: hasNameChange };
      }
      
      // Zeitstempel hinzufügen
      updateObj.updated_at = new Date().toISOString();
      
      console.log('[useUpdateCategory] Sende Update mit Daten:', JSON.stringify(updateObj));
      
      // Ein zweiter Versuch ohne guild_id-Prüfung, falls das erste Update fehlschlägt
      let result;
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updateObj)
          .eq('id', categoryId)
          .eq('guild_id', guildId)
          .select();
          
        if (error) {
          // Wenn es einen Fehler mit guild_id gibt, noch einmal ohne guild_id versuchen
          console.warn('[useUpdateCategory] Erster Update-Versuch fehlgeschlagen:', error);
          throw error;
        }
        
        result = Array.isArray(data) ? data[0] : data;
      } catch (firstAttemptErr) {
        // Zweiter Versuch ohne guild_id-Einschränkung
        try {
          console.log('[useUpdateCategory] Versuche Update ohne guild_id-Filter');
          const { data, error } = await supabase
            .from('categories')
            .update(updateObj)
            .eq('id', categoryId)
            .select();
            
          if (error) {
            throw error;
          }
          
          result = Array.isArray(data) ? data[0] : data;
        } catch (secondAttemptErr: any) {
          console.error('[useUpdateCategory] Auch zweiter Update-Versuch fehlgeschlagen:', secondAttemptErr);
          throw secondAttemptErr;
        }
      }
      
      console.log('[useUpdateCategory] Erfolgreiches Update:', result);
      return result;
    } catch (err: any) {
      console.error('[useUpdateCategory] Fehler:', err);
      setError(err);
      enqueueSnackbar(`Fehler: ${err.message || 'Unbekannter Fehler'}`, { variant: 'error' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);
  
  return {
    updateCategory,
    isLoading,
    error
  };
}