// src/components/DashboardNotificationWrapper.tsx
/**
 * Dashboard-Notification-Wrapper
 * 
 * Diese Komponente:
 * - Stellt den NotificationContext bereit
 * - Integriert den Event-Manager mit dem UI
 * - Bietet eine einheitliche API für Benachrichtigungen im Dashboard
 */

import React, { createContext, useContext } from 'react';
import { useSnackbar } from 'notistack';
import { useNotificationService } from '../services/NotificationManager/notificationService';
import { useEventSubscriber } from '../services/EventManager/eventSubscriber';

// Definiere den Context-Typ
interface NotificationContextType {
  showSuccess: (message: string, options?: any) => void;
  showWarning: (message: string, options?: any) => void;
  showError: (message: string, options?: any) => void;
  showInfo: (message: string, options?: any) => void;
}

// Erstelle den Context mit Default-Werten
const NotificationContext = createContext<NotificationContextType>({
  showSuccess: () => {},
  showWarning: () => {},
  showError: () => {},
  showInfo: () => {},
});

// Hook zum Verwenden des Notification-Contexts
export const useNotification = () => useContext(NotificationContext);

/**
 * Zentraler Wrapper für alle Dashboard-Benachrichtigungen
 * Verwaltet globale Events und stellt eine zentrale API für Benachrichtigungen bereit
 */
const DashboardNotificationWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Verwende den zentralen NotificationService
  const { 
    showSuccess, 
    showWarning, 
    showError, 
    showInfo 
  } = useNotificationService();

  // Context-Wert mit den Notification-Funktionen
  const contextValue = {
    showSuccess,
    showWarning,
    showError,
    showInfo,
  };

  // Stelle sicher, dass der Event-Subscriber aktiv ist
  // (redundant, da er bereits im EventManagerProvider initialisiert wird,
  // aber besser sicher als unsicher)
  useEventSubscriber();
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default DashboardNotificationWrapper;