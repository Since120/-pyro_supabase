// apps/bot/src/hooks/zones/use.create.zone.ts
import { redisPubSub } from '../../pubsub/redis.pubsub';
import { ZoneEvent } from 'pyro-types';
import logger from 'pyro-logger';

// Neuer Ansatz: Verwendung von Redis statt Apollo Client
export function getZoneCreatedObservable() {
  return redisPubSub.subscribe('zoneEvent', (message: ZoneEvent) => {
    // Nur bei Create-Events weiterverarbeiten
    if (message.eventType !== 'created') {
      return;
    }

    logger.info('Received zoneEvent (created):', message);
    
    // Hier die Logik für die Verarbeitung des Zone-Created-Events
    const { id, name, categoryId, discordVoiceId } = message;
    
    // Die Verarbeitung erfolgt jetzt direkt im Event-Handler, diese Hook-Funktion
    // ist nur noch für Kompatibilität oder benutzerdefinierte Logik vorhanden
  });
}
