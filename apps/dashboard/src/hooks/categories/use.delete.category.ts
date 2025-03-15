// apps/dashboard/src/hooks/categories/use.delete.category.ts
import { useState, useCallback } from 'react';
import { supabase } from 'pyro-types';
import { useSnackbar } from 'notistack';
import { useGuildContext } from '../guild/use.guild.context';

export function useDeleteCategory() {
  const { guildId } = useGuildContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!guildId || !categoryId) {
      console.error('[useDeleteCategory] Keine gültige guildId oder categoryId');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Vollständige Kategorie-Informationen holen
      const { data: categoryData, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (!categoryData) {
        throw new Error(`Kategorie mit ID ${categoryId} nicht gefunden`);
      }
      
      // 1. Kategorie als gelöscht markieren (für Discord-Bot)
      console.log(`[useDeleteCategory] Markiere Kategorie als gelöscht`);
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          is_deleted_in_discord: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .eq('guild_id', guildId);
      
      if (updateError) throw updateError;
      
      // Kurze Pause, damit der Bot die Änderung sehen kann
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. Kategorie aus Datenbank löschen
      console.log(`[useDeleteCategory] Lösche Kategorie aus Datenbank`);
      const { data: deleteResult, error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('guild_id', guildId)
        .select();
      
      if (deleteError) throw deleteError;
      
      console.log('[useDeleteCategory] Kategorie gelöscht:', deleteResult);
      return { success: true, categoryData };
    } catch (err: any) {
      console.error('[useDeleteCategory] Fehler:', err);
      setError(err);
      enqueueSnackbar(`Fehler: ${err.message}`, { variant: 'error' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, enqueueSnackbar]);
  
  return {
    deleteCategory,
    isLoading,
    error
  };
}