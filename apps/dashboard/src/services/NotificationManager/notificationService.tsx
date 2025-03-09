// src/services/NotificationManager/notificationService.ts
/**
 * Notification-Service: Zentrale Verwaltung von UI-Benachrichtigungen
 * 
 * Dieser Service:
 * - Vereinheitlicht alle Benachrichtigungen im System
 * - Verhindert doppelte Benachrichtigungen (Deduplizierung)
 * - Bietet einfache Funktionen für verschiedene Benachrichtigungsarten
 * - Integriert sich mit notistack für Toast-Meldungen
 */

import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

/**
 * Vordefinierte Benachrichtigungstypen (entsprechen den notistack-Varianten)
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Standarddauern für verschiedene Benachrichtigungstypen (in ms)
 */
export enum NotificationDuration {
  SHORT = 3000,  // 3 Sekunden
  NORMAL = 5000, // 5 Sekunden
  LONG = 8000    // 8 Sekunden
}

/**
 * Optionen für die Anzeige von Benachrichtigungen
 */
export interface NotificationOptions {
  variant?: VariantType;         // Visuelle Variante (success, error, etc.)
  duration?: number;             // Anzeigedauer in ms
  preventDuplicate?: boolean;    // Doppelte Benachrichtigungen verhindern
  persist?: boolean;             // Dauerhaft anzeigen (nicht automatisch schließen)
  key?: string | number;         // Eindeutiger Schlüssel für Deduplizierung
  autoHideDuration?: number;     // Alternative Bezeichnung für duration
  action?: React.ReactNode;      // Aktion (Button) in der Benachrichtigung
}

// Set für bereits angezeigte Benachrichtigungen (globaler Speicher)
const processedNotifications = new Set<string>();
const NOTIFICATION_TIMEOUT = 5000; // 5 Sekunden Sperrzeit für Duplikate

/**
 * Hook für die Verwendung des Notification-Services
 * Stellt alle Funktionen für Benachrichtigungen bereit
 */
export function useNotificationService() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /**
   * Generiert einen eindeutigen Schlüssel für eine Benachrichtigung
   */
  const getNotificationKey = useCallback((entityId: string, eventType: string): string => {
    // Für Rate-Limit-Events einen eindeutigen Zeitstempel hinzufügen, um Duplikate zu vermeiden
    if (eventType === 'rateLimit' || eventType === 'RATE_LIMIT') {
      return `${entityId}-${eventType}-${Date.now()}`;
    }
    return `${entityId}-${eventType}`;
  }, []);

  /**
   * Prüft, ob eine Benachrichtigung bereits kürzlich angezeigt wurde
   * Verhindert Benachrichtigungsstürme bei schnell aufeinanderfolgenden Events
   * 
   * @param key Eindeutiger Schlüssel der Benachrichtigung
   * @returns true, wenn die Benachrichtigung angezeigt werden sollte; false, wenn sie unterdrückt werden sollte
   */
  const shouldShowNotification = useCallback((key: string): boolean => {
    // Bei DELETE_CONFIRMED oder DELETED Events IMMER eine Benachrichtigung anzeigen
    if (key.includes('-deleted') || key.includes('-deleteConfirmed') || 
        key.includes('-deleteConfirmedExplicit')) {
      console.log(`[Notification] Lösch-Benachrichtigung wird immer angezeigt: ${key}`);
      return true;
    }
    
    // Rate-Limit-Events immer anzeigen (unverändert)
    if (key.includes('-rateLimit-') || key.includes('-RATE_LIMIT-')) {
      console.log(`[Notification] Rate-Limit-Benachrichtigung wird immer angezeigt: ${key}`);
      return true;
    }
    
    if (processedNotifications.has(key)) {
      console.log(`[Notification] Doppelte Benachrichtigung unterdrückt: ${key}`);
      return false;
    }
    
    console.log(`[Notification] Neue Benachrichtigung: ${key}`);
    processedNotifications.add(key);
    
    // Nach 5 Sekunden aus dem Set entfernen
    setTimeout(() => {
      processedNotifications.delete(key);
      console.log(`[Notification] Benachrichtigungssperre für ${key} entfernt`);
    }, NOTIFICATION_TIMEOUT);
    
    return true;
  }, []);

  /**
   * Zeigt eine Erfolgsbenachrichtigung an
   */
  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.SUCCESS,
      autoHideDuration: NotificationDuration.NORMAL,
      ...options
    });
  }, [enqueueSnackbar]);

  /**
   * Zeigt eine Fehlerbenachrichtigung an
   */
  const showError = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.ERROR,
      autoHideDuration: NotificationDuration.LONG,
      ...options
    });
  }, [enqueueSnackbar]);

  /**
   * Zeigt eine Warnbenachrichtigung an
   */
  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.WARNING,
      autoHideDuration: NotificationDuration.LONG,
      ...options
    });
  }, [enqueueSnackbar]);

  /**
   * Zeigt eine Informationsbenachrichtigung an
   */
  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.INFO,
      autoHideDuration: NotificationDuration.NORMAL,
      ...options
    });
  }, [enqueueSnackbar]);

  /**
   * Hauptfunktion zur Anzeige von Benachrichtigungen mit Deduplizierung
   * Diese Funktion sollte für alle Event-basierten Benachrichtigungen verwendet werden
   * 
   * @param entityId ID der zugehörigen Entity
   * @param eventType Typ des Events
   * @param message Anzuzeigende Nachricht
   * @param type Typ der Benachrichtigung (success, error, etc.)
   * @param options Weitere Benachrichtigungsoptionen
   * @returns ID der angezeigten Benachrichtigung oder null (bei Unterdrückung)
   */
  const showNotification = useCallback((
    entityId: string,
    eventType: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    options?: NotificationOptions
  ) => {
    const key = getNotificationKey(entityId, eventType);
    
    if (shouldShowNotification(key)) {
      const snackbarOptions = {
        key,
        variant: type,
        autoHideDuration: 
          type === NotificationType.ERROR || type === NotificationType.WARNING
            ? NotificationDuration.LONG
            : NotificationDuration.NORMAL,
        ...options
      };
      
      return enqueueSnackbar(message, snackbarOptions);
    }
    
    return null;
  }, [enqueueSnackbar, getNotificationKey, shouldShowNotification]);

  /**
   * Gibt alle Funktionen des Notification-Services zurück
   */
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    closeSnackbar
  };
}