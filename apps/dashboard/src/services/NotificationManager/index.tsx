// src/services/NotificationManager/index.ts
/**
 * Zentrater Einstiegspunkt für den Notification-Manager
 * 
 * Exportiert alle öffentlichen Funktionen und Typen des Notification-Managers
 */

// Re-Export aller wichtigen Funktionen und Typen
export { 
  useNotificationService,
  NotificationType,
  NotificationDuration
} from './notificationService';

// Re-Export der Schnittstellen
export type { NotificationOptions } from './notificationService';