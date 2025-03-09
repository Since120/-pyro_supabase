// apps/dashboard/src/hooks/zone/use.zone.events.ts

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSubscription, gql } from '@apollo/client';
import { ZoneEvent as GraphQLZoneEvent } from '@/graphql/generated/graphql';
import { useSnackbar } from 'notistack';
import { useZoneEventSubscription, ZoneEventDocument } from '../../graphql/generated/graphql';


// Erweitere die ZoneEvent Typdefinition mit zusätzlichen Feldern
export interface ZoneEvent extends GraphQLZoneEvent {
  details?: string; // Füge details hinzu
  error?: string;   // Füge error hinzu (Standardisiert mit CategoryEvent)
}

// Standard-Subscription ohne Filter - WICHTIG: Name muss mit Backend übereinstimmen
const { data: subscriptionData } = useZoneEventSubscription();

export interface ZoneEventHookOptions {
  onCreated?: (event: ZoneEvent) => void;
  onUpdated?: (event: ZoneEvent) => void;
  onDeleted?: (event: ZoneEvent) => void;
  onConfirmation?: (event: ZoneEvent) => void;
  onError?: (event: ZoneEvent) => void;
  onQueued?: (event: ZoneEvent) => void;
  onUpdateConfirmed?: (event: ZoneEvent) => void;
  onRateLimit?: (event: ZoneEvent) => void;
  onDeleteConfirmed?: (event: ZoneEvent) => void;
  onData?: (event: ZoneEvent) => void; // Allgemeiner Handler für alle Event-Typen
  onConnectionTimeout?: () => void;    // Callback für Timeout
  disableDefaultNotifications?: boolean;
  watchId?: string | null;
}

// Globales Set für bereits verarbeitete Benachrichtigungen
const processedNotifications = new Set<string>();

/**
 * Zentraler Hook für alle Zone-Events mit optimierter Benachrichtigungsfunktion
 */
export function useZoneEvents({
  onCreated,
  onUpdated,
  onDeleted,
  onConfirmation,
  onError,
  onQueued,
  onUpdateConfirmed,
  onRateLimit,
  onDeleteConfirmed,
  onData,
  onConnectionTimeout,
  disableDefaultNotifications = false,
  watchId = null
}: ZoneEventHookOptions = {}) {
  const { enqueueSnackbar } = useSnackbar();
  const [lastEvent, setLastEvent] = useState<ZoneEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Timeout-Referenz für die Verbindung
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Referenz für einen manuellen Neustart der Subscription
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatischer Neuversuch bei Verbindungsproblemen
  useEffect(() => {
    if (connectionAttempts > 0 && connectionAttempts < 5 && !isConnected && !hasTimedOut) {
      console.log(`[WebSocket] Automatischer Neuversuch #${connectionAttempts} in 5 Sekunden...`);
      
      // Vorherigen Retry-Timeout löschen, falls vorhanden
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Neuen Retry-Timeout setzen
      retryTimeoutRef.current = setTimeout(() => {
        console.log('[WebSocket] Führe Neuverbindung durch...');
        // Hier können wir den Apollo-Client anweisen, die Subscription neu zu starten
        // Dies kann erfolgen, indem wir eine Hilfsfunktion vom Client aufrufen oder
        // indem wir einen Zustand ändern, der die Subscription neu initialisiert
        
        // Für dieses Beispiel erhöhen wir nur den Versuchszähler
        setConnectionAttempts(prev => prev + 1);
      }, 5000);
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connectionAttempts, isConnected, hasTimedOut]);
  
  // Verbindungsstatus-Logging
  useEffect(() => {
    console.log(`[WebSocket] Status: ${isConnected ? 'Verbunden' : 'Nicht verbunden'}`);
    console.log(`[WebSocket] Versuche: ${connectionAttempts}`);
    console.log(`[WebSocket] Timeout: ${hasTimedOut ? 'Ja' : 'Nein'}`);
    
    // Timeout nach 30 Sekunden, wenn keine Verbindung hergestellt werden kann
    if (!isConnected && !hasTimedOut) {
      console.log('[WebSocket] Starte Timeout-Timer...');
      timeoutRef.current = setTimeout(() => {
        console.log('[WebSocket] Verbindung hat Timeout erreicht!');
        setHasTimedOut(true);
        if (onConnectionTimeout) {
          onConnectionTimeout();
        }
      }, 30000); // 30 Sekunden Timeout
    }
    
    // Timeout löschen, wenn Verbindung hergestellt wurde
    if (isConnected && timeoutRef.current) {
      console.log('[WebSocket] Verbindung hergestellt, lösche Timeout-Timer.');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Cleanup-Funktion
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isConnected, connectionAttempts, hasTimedOut, onConnectionTimeout]);
  
  // Überprüfen Sie, ob watchId ein gültiger Wert ist
  const validWatchId = watchId && typeof watchId === 'string' && watchId.trim() !== '' ? watchId : null;

  // Verwenden Sie immer die Basis-Subscription, da die andere auskommentiert wurde
  const { data: subscriptionData } = useSubscription(
    ZoneEventDocument,
    {
      onSubscriptionData: ({ subscriptionData }) => {
        console.log('[WebSocket] Neue Subscription-Daten empfangen:', subscriptionData);
        setIsConnected(true);
        setLoading(false);
      },
      onSubscriptionComplete: () => {
        console.log('[WebSocket] Subscription abgeschlossen (onComplete).');
      },
      onError: (subscriptionError) => {
        console.error('[WebSocket] Subscription-Fehler:', subscriptionError);
        
        // Spezielle Behandlung für "non-nullable field" Fehler
        if (subscriptionError.message?.includes('non-nullable field')) {
          console.warn('[WebSocket] Nicht-optionales Feld wurde als null zurückgegeben - das ist ein Serverproblem');
          
          // Setzen Sie trotzdem isConnected auf true, damit keine unnötigen Reconnect-Versuche stattfinden
          setIsConnected(true);
          setLoading(false);
          
          // Optional: Leeres Event als Fallback erstellen
          const fallbackEvent: ZoneEvent = {
            id: "error-fallback",
            categoryId: "",
            name: "Server-Fehler (null-Wert)",
            eventType: "error" as any,
            message: "Der Server hat einen NULL-Wert für ein Pflichtfeld zurückgegeben",
            timestamp: new Date().toISOString(),
            error: subscriptionError.message,
          };
          
          // Informieren Sie die UI über den Fehler
          setLastEvent(fallbackEvent);
          if (onError) {
            onError(fallbackEvent);
          }
        } else {
          // Normale Fehlerbehandlung
          setError(subscriptionError);
          setConnectionAttempts((prev) => prev + 1);
          setIsConnected(false);
        }
      }
    }
  );

  // DEBUG: Direkte Überprüfung der empfangenen Daten
  useEffect(() => {
    console.log('[DEBUG] Subscription data geändert:', subscriptionData);
    if (subscriptionData?.data?.zoneEvent) {
      console.log('[DEBUG] ZoneEvent vorhanden:', subscriptionData.data.zoneEvent);
    }
  }, [subscriptionData]);

  // Verarbeitung der empfangenen Events
  useEffect(() => {
    console.log('[DEBUG] useEffect für Event-Verarbeitung wird ausgeführt');
    
    if (subscriptionData?.data?.zoneEvent) {
      try {
        setLoading(false);
        
        // DEBUG: Rohe Daten loggen, um zu sehen, was wirklich vom Server kommt
        console.log('[DEBUG] Rohe Event-Daten vom Server:', subscriptionData.data.zoneEvent);
        
        // Vorsichtigerer Ansatz - Extrahieren Sie die Felder explizit, anstatt den Typ zu casten
        const eventData: ZoneEvent = {
          ...subscriptionData.data.zoneEvent,
          // Stellen Sie sicher, dass diese Felder korrekt zugeordnet werden
          id: subscriptionData.data.zoneEvent.id,
          categoryId: subscriptionData.data.zoneEvent.categoryId,
          name: subscriptionData.data.zoneEvent.name || 'Unbekannte Zone',
          eventType: subscriptionData.data.zoneEvent.eventType,
          // Stellen Sie sicher, dass optionale Felder vorhanden sind
          details: subscriptionData.data.zoneEvent.details || undefined,
          error: subscriptionData.data.zoneEvent.error || undefined,
          message: subscriptionData.data.zoneEvent.message || '',
          // ... fügen Sie andere Felder hinzu, die in ZoneEvent erwartet werden
        };
        
        console.log(`[ZoneEvent] Verarbeitetes Event: ${eventData.eventType}`, eventData);
        
        // Update des letzten Events
        setLastEvent(eventData);
        
        // Allgemeiner Handler für alle Event-Typen, wenn vorhanden
        if (onData) {
          onData(eventData);
        }
        
        // Event-spezifische Handler
        switch (eventData.eventType) {
          case 'created':
            console.log('[ZoneEvent] Created-Event erkannt');
            if (onCreated) {
              onCreated(eventData);
            }
            
            if (!disableDefaultNotifications) {
              enqueueSnackbar(
                `Zone "${eventData.name}" erfolgreich erstellt`,
                { variant: 'success', autoHideDuration: 3000 }
              );
            }
            break;
            
          case 'confirmation':
            console.log('[ZoneEvent] Confirmation-Event erkannt');
            if (onConfirmation) {
              onConfirmation(eventData);
            }
            break;
            
          case 'updated':
            console.log('[ZoneEvent] Updated-Event erkannt');
            if (onUpdated) {
              onUpdated(eventData);
            }
            
            if (!disableDefaultNotifications) {
              enqueueSnackbar(
                `Zone "${eventData.name}" erfolgreich aktualisiert`,
                { variant: 'success', autoHideDuration: 3000 }
              );
            }
            break;
            
          case 'deleted':
            console.log('[ZoneEvent] Deleted-Event erkannt');
            if (onDeleted) {
              onDeleted(eventData);
            }
            
            if (!disableDefaultNotifications) {
              enqueueSnackbar(
                `Zone "${eventData.name}" erfolgreich gelöscht`,
                { variant: 'success', autoHideDuration: 3000 }
              );
            }
            break;
            
          case 'error':
            console.log('[ZoneEvent] Error-Event erkannt');
            if (onError) {
              onError(eventData);
            }
            
            if (!disableDefaultNotifications) {
              enqueueSnackbar(
                `Fehler bei Zone "${eventData.name}": ${eventData.error || 'Unbekannter Fehler'}`,
                { variant: 'error', autoHideDuration: 8000 }
              );
            }
            break;
            
          case 'queued':
            console.log('[ZoneEvent] Queued-Event erkannt');
            if (onQueued) {
              onQueued(eventData);
            }
            break;
            
          case 'update-confirmed':
            console.log('[ZoneEvent] Update-Confirmed-Event erkannt');
            if (onUpdateConfirmed) {
              onUpdateConfirmed(eventData);
            }
            break;
            
          case 'rate-limit':
            console.log('[ZoneEvent] Rate-Limit-Event erkannt');
            if (onRateLimit) {
              onRateLimit(eventData);
            }
            
            if (!disableDefaultNotifications) {
              enqueueSnackbar(
                `Discord Rate Limit erreicht für Zone "${eventData.name}"`,
                { variant: 'warning', autoHideDuration: 8000 }
              );
            }
            break;
            
          case 'delete-confirmed':
            console.log('[ZoneEvent] Delete-Confirmed-Event erkannt');
            if (onDeleteConfirmed) {
              onDeleteConfirmed(eventData);
            }
            break;
            
          default:
            console.log(`Unbekannter Event-Typ: ${eventData.eventType}`);
        }
      } catch (error) {
        console.error('Fehler bei der Verarbeitung des Zone-Events:', error);
      }
    }
  }, [subscriptionData, lastEvent, onData, onCreated, onUpdated, onDeleted, onConfirmation, 
      onError, onQueued, onUpdateConfirmed, onRateLimit, onDeleteConfirmed, disableDefaultNotifications, enqueueSnackbar]);

  return {
    lastEvent,
    loading,
    error,
    isConnected,
    connectionAttempts,
    hasTimedOut
  };
}