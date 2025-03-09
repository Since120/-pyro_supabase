// apps/bot/src/hooks/zones/use.update.zone.ts
import { redisPubSub } from '../../pubsub/redis.pubsub';
import { ZoneEvent } from 'pyro-types';
import logger from 'pyro-logger';

// Neuer Ansatz: Verwendung von Redis statt Apollo Client für Zone-Updates
export function getZoneUpdatedObservable() {
  return redisPubSub.subscribe('zoneEvent', (message: ZoneEvent) => {
    // Nur bei Update-Events weiterverarbeiten
    if (message.eventType !== 'updated') {
      return;
    }

    logger.info('Received zoneEvent (updated):', message);
    
    // Hier die Logik für die Verarbeitung des Zone-Updated-Events
    const { id, name, categoryId, discordVoiceId } = message;
    
    // Die Verarbeitung erfolgt jetzt direkt im Event-Handler, diese Hook-Funktion
    // ist nur noch für Kompatibilität oder benutzerdefinierte Logik vorhanden
  });
}

// Neuer Ansatz: Verwendung von Redis statt Apollo Client für Zone-Löschungen
export function getZoneDeletedObservable() {
  return redisPubSub.subscribe('zoneEvent', (message: ZoneEvent) => {
    // Nur bei Delete-Events weiterverarbeiten
    if (message.eventType !== 'deleted') {
      return;
    }

    logger.info('Received zoneEvent (deleted):', message);
    
    // Hier die Logik für die Verarbeitung des Zone-Deleted-Events
    const { id, discordVoiceId } = message;
    
    // Die Verarbeitung erfolgt jetzt direkt im Event-Handler, diese Hook-Funktion
    // ist nur noch für Kompatibilität oder benutzerdefinierte Logik vorhanden
  });
}
