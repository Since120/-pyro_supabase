// apps/dashboard/src/hooks/categories/use.create.category.ts
import { useState, useCallback } from 'react';
import { supabase } from 'pyro-types';
import { useSnackbar } from 'notistack';
import { useGuildContext } from '../guild/use.guild.context';

type CategoryFormData = {
  name: string;
  category_type: string;
  guild_id?: string;
  allowed_roles: string[];
  is_visible?: boolean;
  is_tracking_active?: boolean;
  is_send_setup?: boolean;
  settings?: Record<string, any>;
};

export function useCreateCategory() {
  const { guildId } = useGuildContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const createCategory = useCallback(async (formData: CategoryFormData) => {
    if (!guildId && !formData.guild_id) {
      enqueueSnackbar('Keine Guild ID gefunden', { variant: 'error' });
      return null;
    }
    
    const effectiveGuildId = formData.guild_id || guildId;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Settings vorbereiten
      const settingsData = formData.settings || {};
      // Base-Settings mit Defaults
      const defaultSettings = {
        is_visible: formData.is_visible ?? true,
        is_tracking_active: formData.is_tracking_active ?? false,
        is_send_setup: formData.is_send_setup ?? false,
        is_deleted_in_discord: false,
        // WICHTIG: Flag, dass KEINE Task-Queue nötig ist (jetzt in settings)
        process_via_queue: false
      };
      
      // Kombinierte Settings
      const combinedSettings = {
        ...defaultSettings,
        ...settingsData
      };
      
      // Daten für Supabase vorbereiten
      const categoryData = {
        guild_id: effectiveGuildId,
        name: formData.name,
        category_type: formData.category_type,
        allowed_roles: formData.allowed_roles,
        settings: combinedSettings,
        is_visible: formData.is_visible ?? true,
        is_tracking_active: formData.is_tracking_active ?? false,
        is_send_setup: formData.is_send_setup ?? false
        // requires_task_queue wurde entfernt und ist jetzt in settings
      };
      
      console.log('[useCreateCategory] Erstelle neue Kategorie:', categoryData);
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
        
      if (error) {
        console.error('[useCreateCategory] Supabase Fehler:', error);
        setError(error);
        enqueueSnackbar(`Fehler: ${error.message || 'Unbekannter Fehler'}`, { variant: 'error' });
        return null;
      }
      
      console.log('[useCreateCategory] Kategorie erfolgreich erstellt:', data);
      return data;
    } catch (err: any) {
      console.error('[useCreateCategory] Fehler:', err);
      setError(err);
      enqueueSnackbar(`Fehler: ${err.message || 'Unbekannter Fehler'}`, { variant: 'error' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);
  
  return {
    createCategory,
    isLoading,
    error
  };
}