// apps/dashboard/src/hooks/categories/use.category.events.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from 'pyro-types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useGuildContext } from '../guild/use.guild.context';

export function useCategoryEvents() {
  const { guildId } = useGuildContext();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Kategorien laden
  const fetchCategories = useCallback(async () => {
    if (!guildId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useCategoryEvents] Lade Kategorien');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('guild_id', guildId);
        
      if (error) throw error;
      
      console.log('[useCategoryEvents] Kategorien geladen:', data?.length || 0);
      setCategories(data || []);
    } catch (err: any) {
      console.error('[useCategoryEvents] Fehler beim Laden:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);
  
  // Realtime-Events abonnieren
  useEffect(() => {
    if (!guildId) return;
    
    fetchCategories();
    
    const channelName = `categories-events-${guildId}`;
    console.log(`[useCategoryEvents] Starte Realtime-Subscription: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `guild_id=eq.${guildId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[useCategoryEvents] Event empfangen:`, payload);
          
          // Updates verarbeiten
          if (payload.eventType === 'INSERT') {
            // Bei neuen Einträgen komplett neu laden
            fetchCategories();
          } else if (payload.eventType === 'UPDATE') {
            // Bei Updates nur die betroffene Kategorie aktualisieren
            if (payload.new) {
              setCategories(prev => prev.map(cat => 
                cat.id === payload.new.id ? payload.new : cat
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            // Bei Löschungen alles neu laden
            fetchCategories();
          }
          
          // UI-Update triggern
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log(`[useCategoryEvents] Channel Status: ${status}`);
      });
      
    // Cleanup
    return () => {
      console.log(`[useCategoryEvents] Cleanup Subscription`);
      channel.unsubscribe();
    };
  }, [guildId, fetchCategories]);
  
  return {
    categories,
    isLoading,
    error,
    refreshTrigger,
    fetchCategories
  };
}