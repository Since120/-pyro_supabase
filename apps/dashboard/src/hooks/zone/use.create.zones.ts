// apps/dashboard/src/hooks/zone/use.create.zones.ts
import { useMutation, useSubscription, gql } from '@apollo/client';
import { useState } from 'react';
import {
  CreateZoneDocument,
  CreateZoneMutation,
  CreateZoneMutationVariables,
  Zone,
  GetZonesDocument,
  ZoneEventDocument, 
  ZoneEvent
} from '../../graphql/generated/graphql';

// Prüft, ob ein Objekt dem Zone-Typ entspricht (mit einer vollständigen category)
function isCompleteZone(obj: any): obj is Zone {
  return (
    obj && 
    typeof obj === 'object' && 
    obj.id && 
    obj.category && 
    typeof obj.category === 'object' && 
    obj.category.id
  );
}

/**
 * Hook für die Erstellung von Zonen
 * Erweitert um verbesserte Cache-Aktualisierung und Event-Tracking-Funktionalität
 */
export const useCreateZone = (onZoneCreated?: (data: Zone) => void) => {
  const [subscribedZone, setSubscribedZone] = useState<Zone | null>(null);
  // Tracking für die letzten erstellten Zone-IDs
  const [lastCreatedZoneId, setLastCreatedZoneId] = useState<string | null>(null);

  const [createZone, mutationResult] = useMutation<CreateZoneMutation, CreateZoneMutationVariables>(
    CreateZoneDocument,
    {
      // Update Apollo cache with the newly created zone
      update: (cache, { data }) => {
        if (!data?.createZone) return;
        
        try {
          // Sicherstellen, dass createZone eine vollständige Zone ist (mit category)
          if (!isCompleteZone(data.createZone)) {
            console.warn('Created zone object is missing required fields (like category)');
            return;
          }
          
          // Read existing zones from cache
          const existingData = cache.readQuery<{ zones: Zone[] }>({
            query: GetZonesDocument
          });
          
          // TypeScript-sicherer Check
          if (existingData && existingData.zones) {
            // Add new zone to cache
            cache.writeQuery({
              query: GetZonesDocument,
              data: {
                zones: [
                  ...existingData.zones,
                  data.createZone
                ]
              }
            });
          }
          
          // Speichere die letzt erstellte Zone-ID für Event-Matching
          setLastCreatedZoneId(data.createZone.id);
          
          // Optional callback
          if (onZoneCreated) {
            onZoneCreated(data.createZone);
          }
        } catch (error) {
          console.error('Error updating cache:', error);
        }
      }
    }
  );

  // Subscription für alle Zone-Events mit Fokus auf 'created' und 'confirmation'
  useSubscription(ZoneEventDocument, {
        onData: ({ data, client }) => {
      if (!data?.data) return;
      
      const eventData = data.data.zoneEvent as ZoneEvent;
      
      // Filter: Nur eigene erstellte Zonen verfolgen
      if (lastCreatedZoneId && eventData.id === lastCreatedZoneId) {
        console.log(`Zone event received for tracked zone ${lastCreatedZoneId}: ${eventData.eventType}`);
        
        // Bei 'created' oder 'confirmation' Events
        if (eventData.eventType === 'created' || eventData.eventType === 'confirmation') {
          console.log('Zone created/confirmed event received:', eventData);
          
          // Da wir nicht die vollständigen Zone-Daten haben, machen wir einen refetch
          client.query({
            query: gql`
              query GetZone($id: ID!) {
                zone(id: $id) {
                  id
                  zoneKey
                  name
                  minutesRequired
                  pointsGranted
                  lastUsageAt
                  totalSecondsInZone
                  isDeletedInDiscord
                  categoryId
                  discordVoiceId
                  createdAt
                  updatedAt
                  category {
                    id
                    name
                    discordCategoryId
                  }
                }
              }
            `,
            variables: { id: eventData.id },
            fetchPolicy: 'network-only'
          }).then(response => {
            if (response.data?.zone) {
              const fetchedZone = response.data.zone;
              
              // Prüfen, ob alle erforderlichen Felder vorhanden sind
              if (isCompleteZone(fetchedZone)) {
                setSubscribedZone(fetchedZone);
                
                // Aktualisieren des Apollo-Caches (nur wenn discordVoiceId sich geändert hat)
                if (eventData.discordVoiceId) {
                  try {
                    client.cache.modify({
                      id: client.cache.identify(fetchedZone),
                      fields: {
                        discordVoiceId() {
                          return eventData.discordVoiceId;
                        }
                      }
                    });
                    
                    // Aktualisieren der Zonen-Liste im Cache
                    client.cache.modify({
                      fields: {
                        zones(existingZonesRefs = [], { readField, toReference }) {
                          return existingZonesRefs.map((zoneRef: any) => {
                            const id = readField('id', zoneRef);
                            return id === fetchedZone.id ? toReference(fetchedZone) : zoneRef;
                          });
                        },
                      },
                    });
                  } catch (cacheError) {
                    console.error('Error updating cache with zone data:', cacheError);
                  }
                }
                
                if (onZoneCreated) {
                  onZoneCreated(fetchedZone);
                }
              } else {
                console.warn('Fetched zone does not have all required fields:', fetchedZone);
              }
            }
          }).catch(error => {
            console.error('Error fetching complete zone data:', error);
          });
        }
        
        // Bei Fehler-Events
        if (eventData.eventType === 'error') {
          console.error('Error event received for zone creation:', eventData);
          // Hier könnte man spezifische Fehlerbehandlung hinzufügen
        }
      }
    },
  });

  return {
    createZone,
    subscribedZone,
    lastCreatedZoneId,
    loading: mutationResult.loading,
    error: mutationResult.error,
  };
};



