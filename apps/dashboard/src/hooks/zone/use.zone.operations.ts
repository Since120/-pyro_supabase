// src/hooks/zone/use.zone.operations.ts
/**
 * Integrierter Hook für Zone-Operationen
 * 
 * Dies ist die zentrale Schnittstelle für die Arbeit mit Zonen-Events.
 * Dieser Hook:
 * - Verwendet den Event-Manager im Hintergrund
 * - Bietet einheitliche Methoden für alle Zone-Operationen
 * - Unterstützt Tracking von modalen Zuständen und Operationen
 * - Gibt Events an den UI-Code zur Anzeige durch
 * 
 * HINWEIS: Dieser Hook ersetzt die älteren individuellen Hooks für
 * Zone-Operationen und -Events.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSupabaseZones } from './use.supabase.zones';
import { useEventManager } from '../../services/EventManager';
import { EntityType, OperationType, ZoneEventType, operationIDs } from '../../services/EventManager/typeDefinitions';

// Types aus Supabase für Zonen
import { Zone, CreateZoneInput, UpdateZoneInput } from '../../types/zone.types';

interface ZoneOperationOptions {
  modalId?: string;               // ID des zugehörigen Modals (für Auto-Close)
  onSuccess?: (data: any) => void; // Callback bei Erfolg
  onError?: (error: any) => void;  // Callback bei Fehler
}

interface ZoneOperationResult {
  loading: boolean;               // Lädt die Operation?
  error: Error | null;            // Fehlerobjekt (falls vorhanden)
  data: any;                      // Rückgabedaten (falls vorhanden)
}

/**
 * Zentraler Hook für alle Zone-Operationen und -Events
 * Dies ist der neue, einheitliche Weg, um mit Zonen zu arbeiten
 */
export function useZoneOperations(guildId: string = '') {
  const { startOperation, completeOperation, getOperationStatusForModal } = useEventManager();
  
  // Supabase Zonen-Hook anstelle von GraphQL
  const { 
    createZone: supabaseCreateZone, 
    updateZone: supabaseUpdateZone, 
    deleteZone: supabaseDeleteZone,
    isLoading
  } = useSupabaseZones(guildId);

  /**
   * Zentrale Zone-Erstellungsmethode
   */
  const createZone = useCallback(async (
    input: CreateZoneInput, 
    options: ZoneOperationOptions = {}
  ) => {
    const { modalId, onSuccess, onError } = options;
    const operationId = operationIDs.zone.create;
    
    try {
      // Operation starten
      startOperation({
        id: operationId,
        entityType: EntityType.ZONE,
        operationType: OperationType.CREATE,
        modalId,
        data: input
      });
      
      // Zone in Supabase erstellen
      const result = await supabaseCreateZone(input);
      
      // Operation abschließen
      completeOperation({
        id: operationId,
        success: true,
        data: result,
        eventType: ZoneEventType.CREATED
      });
      
      // Success Callback aufrufen
      if (onSuccess) onSuccess(result);
      
      return { success: true, data: result };
    } catch (error) {
      // Operation fehlgeschlagen
      completeOperation({
        id: operationId,
        success: false,
        error: error as Error,
        eventType: ZoneEventType.ERROR
      });
      
      // Error Callback aufrufen
      if (onError) onError(error);
      
      return { success: false, error };
    }
  }, [startOperation, completeOperation, supabaseCreateZone]);

  /**
   * Zentrale Zone-Aktualisierungsmethode
   */
  const updateZone = useCallback(async (
    id: string, 
    input: UpdateZoneInput, 
    options: ZoneOperationOptions = {}
  ) => {
    const { modalId, onSuccess, onError } = options;
    const operationId = operationIDs.zone.update;
    
    try {
      // Operation starten
      startOperation({
        id: operationId,
        entityType: EntityType.ZONE,
        operationType: OperationType.UPDATE,
        modalId,
        data: { id, ...input }
      });
      
      // Zone in Supabase aktualisieren
      const result = await supabaseUpdateZone(id, input);
      
      // Operation abschließen
      completeOperation({
        id: operationId,
        success: true,
        data: result,
        eventType: ZoneEventType.UPDATED
      });
      
      // Success Callback aufrufen
      if (onSuccess) onSuccess(result);
      
      return { success: true, data: result };
    } catch (error) {
      // Operation fehlgeschlagen
      completeOperation({
        id: operationId,
        success: false,
        error: error as Error,
        eventType: ZoneEventType.ERROR
      });
      
      // Error Callback aufrufen
      if (onError) onError(error);
      
      return { success: false, error };
    }
  }, [startOperation, completeOperation, supabaseUpdateZone]);

  /**
   * Zentrale Zone-Löschmethode
   */
  const deleteZone = useCallback(async (
    id: string, 
    options: ZoneOperationOptions = {}
  ) => {
    const { modalId, onSuccess, onError } = options;
    const operationId = operationIDs.zone.delete;
    
    try {
      // Operation starten
      startOperation({
        id: operationId,
        entityType: EntityType.ZONE,
        operationType: OperationType.DELETE,
        modalId,
        data: { id }
      });
      
      // Zone in Supabase löschen
      const result = await supabaseDeleteZone(id);
      
      // Operation abschließen
      completeOperation({
        id: operationId,
        success: true,
        data: result,
        eventType: ZoneEventType.DELETED
      });
      
      // Success Callback aufrufen
      if (onSuccess) onSuccess(result);
      
      return { success: true, data: result };
    } catch (error) {
      // Operation fehlgeschlagen
      completeOperation({
        id: operationId,
        success: false,
        error: error as Error,
        eventType: ZoneEventType.ERROR
      });
      
      // Error Callback aufrufen
      if (onError) onError(error);
      
      return { success: false, error };
    }
  }, [startOperation, completeOperation, supabaseDeleteZone]);

  return {
    // Operationen
    createZone,
    updateZone,
    deleteZone,
    
    // Status
    loading: isLoading,
    
    // Hilfsmethoden
    getModalOperationStatus: getOperationStatusForModal
  };
}

/**
 * Vereinfachter Hook für das Tracking einer einzelnen Zone-ID und zugehöriger Events
 * Nützlich für Komponenten, die nur eine bestimmte Zone beobachten müssen
 * 
 * @param zoneId ID der zu überwachenden Zone
 * @param options Zusätzliche Optionen
 */
export function useZoneTracking(zoneId?: string | null, options: {
  onConfirmation?: (data: any) => void;
  onUpdateConfirmed?: (data: any) => void;
  onDeleteConfirmed?: (data: any) => void;
  onError?: (error: any) => void;
} = {}) {
  // Hier könnten wir später Supabase Realtime Subscriptions implementieren
  // Momentan ist dieser Hook funktionslos, bis wir ihn mit Supabase ersetzen
  
  return {
    tracking: false,
    loading: false,
    error: null
  };
}