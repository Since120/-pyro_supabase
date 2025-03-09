// src/services/NotificationManager/index.ts
/**
 * Zentrater Einstiegspunkt f�r den Notification-Manager
 * 
 * Exportiert alle �ffentlichen Funktionen und Typen des Notification-Managers
 */

// Re-Export aller wichtigen Funktionen und Typen
export { 
  useNotificationService,
  NotificationType,
  NotificationDuration
} from './notificationService';

// Re-Export der Schnittstellen
export type { NotificationOptions } from './notificationService';