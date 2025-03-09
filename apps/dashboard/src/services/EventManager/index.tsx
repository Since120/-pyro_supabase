// src/services/EventManager/index.ts
/**
 * Zentraler Event-Manager für die Verwaltung aller Event-Typen im System
 * 
 * Dieser Service dient als zentrale Anlaufstelle für:
 * 1. Event-Subscriptions (GraphQL Subscriptions für Kategorie-, Zone-, etc. Events)
 * 2. Event-Verarbeitung (Statusaktualisierung, Fehlerbehandlung)
 * 3. UI-Benachrichtigungen (Toast/Snackbar-Meldungen)
 * 4. Modal-Verwaltung (automatisches Schließen/Öffnen basierend auf Event-Status)
 */

import React from 'react';
import { useEventSubscriber } from './eventSubscriber';
import { useEventManager } from './eventStore';
import { useNotificationService } from '../NotificationManager/notificationService';

// Re-export wichtiger Funktionen für einfachen Zugriff
export { useEventManager } from './eventStore';
export { useNotificationService } from '../NotificationManager/notificationService';
export * from './typeDefinitions';

// Provider-Komponente für globale Event-Verwaltung
// Diese Komponente sollte möglichst weit oben in der Komponentenhierarchie eingebunden werden
export function EventManagerProvider({ children }: { children: React.ReactNode }) {
  // Event-Subscriber für Realtime-Updates
  useEventSubscriber();
  console.log('[EventManager] Initialized with Supabase Realtime subscriptions');
  
  return <>{children}</>;
}