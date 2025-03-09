// src/services/EventManager/eventSubscriber.ts
/**
 * Event-Subscriber: Überwacht Supabase Realtime und verarbeitet eingehende Events
 * 
 * Dieser Service:
 * - Abonniert alle relevanten Supabase Realtime-Channels (Category, Zone, etc.)
 * - Verarbeitet eingehende Events und aktualisiert den Event-Store
 * - Zeigt Benachrichtigungen basierend auf Event-Typ und -Inhalt an
 * - Schließt Operationen basierend auf Event-Bestätigungen oder -Fehlern ab
 */

import { useEffect } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from 'pyro-types';
import { useEventManager } from './eventStore';
import { useNotificationService, NotificationType, NotificationDuration } from '../NotificationManager/notificationService';
import { CategoryEventType, ZoneEventType, EntityType, OperationType, operationIDs } from './typeDefinitions';
import { useGuildContext } from '../../hooks/guild/use.guild.context';

// Typen für Event-Konfigurationen
interface EventConfigMessage {
  (name: string, details?: any): string;
}

interface EventConfig {
  message: EventConfigMessage | string;
  variant: NotificationType;
  duration?: number;
}

// Event-Konfigurationen für verschiedene Entity-Typen und Event-Typen
const eventNotificationConfigs: Record<string, Record<string, EventConfig>> = {
  // Kategorie-Events
  [EntityType.CATEGORY]: {
    [CategoryEventType.CREATED]: { 
      message: (name: string) => `Kategorie "${name}" wurde erstellt`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.CONFIRMATION]: { 
      message: (name: string) => `Kategorie "${name}" wurde in Discord erstellt`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.UPDATED]: { 
      message: (name: string) => `Kategorie "${name}" wurde aktualisiert`, 
      variant: NotificationType.INFO 
    },
    [CategoryEventType.UPDATE_CONFIRMED]: { 
      message: (name: string) => `Änderung an "${name}" wurde in Discord übernommen`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.DELETED]: { 
      message: (name: string) => `Kategorie "${name}" wurde gelöscht`, 
      variant: NotificationType.INFO 
    },
    [CategoryEventType.DELETE_CONFIRMED]: { 
      message: () => `Kategorie wurde aus Discord entfernt`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.ERROR]: { 
      message: (_: string, error: string) => `Fehler: ${error}`, 
      variant: NotificationType.ERROR, 
      duration: NotificationDuration.LONG 
    },
    [CategoryEventType.RATE_LIMIT]: { 
      message: (name: string, details: any) => {
        const delayMinutes = details?.delayMinutes || Math.ceil((details?.delayMs || 0) / 60000);
        return `Discord Rate Limit: Änderung an "${name}" wird in ${delayMinutes} Minute(n) durchgeführt`;
      }, 
      variant: NotificationType.WARNING, 
      duration: NotificationDuration.LONG 
    },
    [CategoryEventType.QUEUED]: {
      message: (name: string) => `Änderung an "${name}" wurde in die Warteschlange aufgenommen`,
      variant: NotificationType.INFO
    }
  },
  
  // Zone-Events (ähnliche Struktur wie Kategorie-Events)
  [EntityType.ZONE]: {
    [ZoneEventType.CREATED]: { 
      message: (name: string) => `Zone "${name}" wurde erstellt`, 
      variant: NotificationType.SUCCESS 
    },
    [ZoneEventType.CONFIRMATION]: { 
      message: (name: string) => `Zone "${name}" wurde in Discord erstellt`, 
      variant: NotificationType.SUCCESS 
    },
    [ZoneEventType.UPDATED]: { 
      message: (name: string) => `Zone "${name}" wurde aktualisiert`, 
      variant: NotificationType.INFO 
    },
    [ZoneEventType.UPDATE_CONFIRMED]: { 
      message: (name: string) => `Änderung an Zone "${name}" wurde in Discord übernommen`, 
      variant: NotificationType.SUCCESS 
    },
    [ZoneEventType.DELETED]: { 
      message: (name: string) => `Zone "${name}" wurde gelöscht`, 
      variant: NotificationType.INFO 
    },
    [ZoneEventType.DELETE_CONFIRMED]: { 
      message: () => `Zone wurde aus Discord entfernt`, 
      variant: NotificationType.SUCCESS 
    },
    [ZoneEventType.ERROR]: { 
      message: (_: string, error: string) => `Fehler: ${error}`, 
      variant: NotificationType.ERROR, 
      duration: NotificationDuration.LONG 
    },
    [ZoneEventType.RATE_LIMIT]: { 
      message: (name: string, details: any) => {
        const delayMinutes = details?.delayMinutes || Math.ceil((details?.delayMs || 0) / 60000);
        return `Discord Rate Limit: Änderung an Zone "${name}" wird in ${delayMinutes} Minute(n) durchgeführt`;
      }, 
      variant: NotificationType.WARNING, 
      duration: NotificationDuration.LONG 
    },
    [ZoneEventType.QUEUED]: {
      message: (name: string) => `Änderung an Zone "${name}" wurde in die Warteschlange aufgenommen`,
      variant: NotificationType.INFO
    }
  }
};

/**
 * Hook zum Abonnieren und Verarbeiten aller Event-Typen über Supabase Realtime
 * Dieser Hook wird in der EventManagerProvider-Komponente verwendet
 */
export function useEventSubscriber() {
  const eventManager = useEventManager();  
  const { completeOperation, getOperationByEntityId } = eventManager;
  const { showNotification } = useNotificationService();
  const { guildId } = useGuildContext();
  
  useEffect(() => {
    console.log(`[EventSubscriber] Initialisiere Supabase Realtime-Subscription für Guild: ${guildId}`);
    
    // Keine Event-Abonnements ohne Guild ID
    if (!guildId) {
      console.warn('[EventSubscriber] Keine Guild ID gefunden, überspringe Subscriptions');
      return;
    }
    
    console.log(`[EventSubscriber] Testen mehrerer Realtime-Kanäle...`);
    
    // Abonniere alle Änderungen an der discord_sync-Tabelle ohne Filter
    const channelAll = supabase
      .channel('discord-sync-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discord_sync',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[EventSubscriber] ALLE Realtime-Events:`, payload);
        }
      )
      .subscribe((status) => {
        console.log(`[EventSubscriber] Kanal 'discord-sync-all' Status: ${status}`);
      });

    // Abonniere die categories-Tabelle (wo die Kategorie zuerst erstellt wird)
    const channelCategories = supabase
      .channel('categories-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[EventSubscriber] Categories Realtime-Event:`, payload);
          
          // Wenn eine neue Kategorie erstellt wird, zeige eine Benachrichtigung
          if (payload.eventType === 'INSERT') {
            const category = payload.new;
            if (category) {
              console.log(`[EventSubscriber] Neue Kategorie erstellt:`, category);
              
              // Zeige Benachrichtigung
              showNotification(
                category.id,
                CategoryEventType.CONFIRMATION,
                `Kategorie "${category.name}" wurde erstellt!`,
                NotificationType.SUCCESS,
                { 
                  duration: NotificationDuration.LONG,
                  preventDuplicate: true
                }
              );
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[EventSubscriber] Kanal 'categories-all' Status: ${status}`);
      });
      
    // Abonniere auch Änderungen für die Guild
    const channel = supabase
      .channel(`discord-sync-events-${guildId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discord_sync',
          filter: `guild_id=eq.${guildId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[EventSubscriber] Guild-spezifisches Realtime-Event empfangen:`, payload);
      
          if (!payload.new) return;
      
          const eventData = payload.new;
          console.log(`[EventSubscriber] Discord-Sync Event empfangen:`, eventData);
          
          // Bei Realtime-Events aus der discord_sync Tabelle arbeiten wir direkt mit den Feldern
          const { id: entity_id, entity_type, sync_status, data } = eventData;
          console.log(`[EventSubscriber] Verarbeite Discord-Sync: id=${entity_id}, entity_type=${entity_type}, sync_status=${sync_status}`);
          
          // Finde die passende Operation
          const operation = getOperationByEntityId(entity_id, entity_type as EntityType);
          if (!operation) {
            console.warn(`[EventSubscriber] Keine passende Operation für Entity ${entity_id} gefunden. Zeige Benachrichtigung trotzdem an.`);
            
            // Auch ohne zugehörige Operation eine Benachrichtigung anzeigen
            let eventType;
            let entityName = data?.name || 'Unbekannt';
            
            // Bestimme den Event-Typ basierend auf entity_type und sync_status
            if (entity_type === EntityType.CATEGORY) {
              if (sync_status === 'synced') {
                eventType = CategoryEventType.CONFIRMATION;
              } else if (sync_status === 'error') {
                eventType = CategoryEventType.ERROR;
              }
            } else if (entity_type === EntityType.ZONE) {
              if (sync_status === 'synced') {
                eventType = ZoneEventType.CONFIRMATION;
              } else if (sync_status === 'error') {
                eventType = ZoneEventType.ERROR;
              }
            }
            
            // Wenn ein gültiger Event-Typ gefunden wurde, Benachrichtigung anzeigen
            if (eventType) {
              const config = eventNotificationConfigs[entity_type]?.[eventType];
              if (config) {
                const message = typeof config.message === 'function' 
                  ? config.message(entityName, data?.error_message || data?.message) 
                  : config.message;
                
                console.log(`[EventSubscriber] Zeige Benachrichtigung ohne Operation: ${message}`);
                
                // Korrekte Parameter für showNotification
                showNotification(
                  entity_id,
                  eventType,
                  message,
                  config.variant,
                  { 
                    duration: config.duration,
                    preventDuplicate: true
                  }
                );
              }
            }
            
            return;
          }
          
          // Bestimme den Event-Typ basierend auf entity_type und sync_status
          let eventType;
          let entityName = data?.name || 'Unbekannt';
          
          if (entity_type === EntityType.CATEGORY) {
            if (sync_status === 'synced') {
              eventType = CategoryEventType.CONFIRMATION;
            } else if (sync_status === 'error') {
              eventType = CategoryEventType.ERROR;
            }
          } else if (entity_type === EntityType.ZONE) {
            if (sync_status === 'synced') {
              eventType = ZoneEventType.CONFIRMATION;
            } else if (sync_status === 'error') {
              eventType = ZoneEventType.ERROR;
            }
          }
          
          // Bei gültigem Event-Typ: Operation abschließen und Notification anzeigen
          if (eventType) {
            completeOperation({
              id: operation.entityId,
              success: sync_status === 'synced',
              data: eventData,
              eventType
            });
            
            // Zeige passende Benachrichtigung
            const config = eventNotificationConfigs[entity_type]?.[eventType];
            if (config) {
              const message = typeof config.message === 'function' 
                ? config.message(entityName, data?.error_message || data?.message) 
                : config.message;
              
              // Korrekte Parameter für showNotification
              showNotification(
                entity_id,
                eventType,
                message,
                config.variant,
                { 
                  duration: config.duration,
                  preventDuplicate: true
                }
              );
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[EventSubscriber] Kanal 'discord-sync-events-${guildId}' Status: ${status}`);
      });
    
    // Cleanup beim Unmounten
    return () => {
      console.log('[EventSubscriber] Cleanup Supabase Realtime-Subscriptions');
      channelAll.unsubscribe();
      channelCategories.unsubscribe();
      channel.unsubscribe();
    };
  }, [guildId, completeOperation, getOperationByEntityId, showNotification]);
}