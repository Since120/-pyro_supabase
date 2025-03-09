// apps/dashboard/src/hooks/zone/use.update.zones.ts
import { useMutation, useSubscription, gql } from '@apollo/client';
import { useState } from 'react';
import {
  UpdateZoneDocument,
  DeleteZoneDocument,
  UpdateZoneMutation,
  UpdateZoneMutationVariables,
  DeleteZoneMutation,
  DeleteZoneMutationVariables,
  ZoneEventDocument,
  Zone,
  ZoneEvent,
} from '../../graphql/generated/graphql';



export const useUpdateZone = (
  onZoneUpdated?: (data: Zone) => void,
  onZoneDeleted?: (id: string) => void
) => {
  const [subscribedUpdatedZone, setSubscribedUpdatedZone] = useState<Zone | null>(null);
  const [subscribedDeletedZoneId, setSubscribedDeletedZoneId] = useState<string | null>(null);

  const [updateZone, updateMutationResult] = useMutation<UpdateZoneMutation, UpdateZoneMutationVariables>(
    UpdateZoneDocument
  );

  const [deleteZone, deleteMutationResult] = useMutation<DeleteZoneMutation, DeleteZoneMutationVariables>(
    DeleteZoneDocument
  );

  // Subscription für alle Zone-Events
  useSubscription(ZoneEventDocument, {
    onData: ({ data, client }) => {
      if (!data?.data) return;
      
      const eventData = data.data.zoneEvent as ZoneEvent;
      
      switch (eventData.eventType) {
        case 'updated':
          console.log('Zone updated event received:', eventData);
          
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
              const updatedZone = response.data.zone as Zone;
              setSubscribedUpdatedZone(updatedZone);
              
              // Aktualisieren des Apollo-Caches
              client.cache.modify({
                fields: {
                  zones(existingZonesRefs = [], { readField, toReference }) {
                    return existingZonesRefs.map((zoneRef: any) => 
                      readField('id', zoneRef) === updatedZone.id ? toReference(updatedZone) : zoneRef
                    );
                  },
                },
              });
              
              if (onZoneUpdated) {
                onZoneUpdated(updatedZone);
              }
            }
          });
          break;
          
        case 'deleted':
          console.log('Zone deleted event received:', eventData);
          setSubscribedDeletedZoneId(eventData.id);
          
          // Aktualisieren des Apollo-Caches
          client.cache.modify({
            fields: {
              zones(existingZonesRefs = [], { readField }) {
                return existingZonesRefs.filter(
                  (zoneRef: any) => readField('id', zoneRef) !== eventData.id
                );
              },
            },
          });
          
          if (onZoneDeleted) {
            onZoneDeleted(eventData.id);
          }
          break;
      }
    },
  });

  return {
    updateZone,
    deleteZone,
    subscribedUpdatedZone,
    subscribedDeletedZoneId,
    updateLoading: updateMutationResult.loading,
    updateError: updateMutationResult.error,
    deleteLoading: deleteMutationResult.loading,
    deleteError: deleteMutationResult.error,
  };
};