// src/services/EventManager/eventStore.ts
/**
 * Event-Store: Zustandsverwaltung für alle laufenden Operationen
 * 
 * Dieser Store verwaltet:
 * 1. Aktive Operationen (Erstellen, Aktualisieren, Löschen) für verschiedene Entitäten
 * 2. Zugehörige Modals, die während Operationen geöffnet/geschlossen werden müssen
 * 
 * Die Komponenten interagieren mit diesem Store durch:
 * - Starten/Abschließen von Operationen
 * - Registrieren/Deregistrieren von Modals
 * - Abfragen des Status von Operationen und Modals
 */

import { create } from 'zustand';
import { 
  EntityOperation, 
  OperationStatus, 
  EntityType, 
  OperationType,
  EventType
} from './typeDefinitions';

/**
 * Definition des EventStore-Zustands
 */
interface EventStoreState {
  // Zustand
  operations: Record<string, EntityOperation>;
  openModals: Set<string>;
  
  // Operations-Management
  startOperation: (operation: {
    id: string;
    entityType: EntityType;
    operationType: OperationType;
    modalId?: string;
    data?: any;
  }) => string;
  
  completeOperation: (params: {
    id: string;
    success: boolean;
    error?: Error;
    data?: any;
    eventType?: EventType;
  }) => void;
  
  // Modal-Management
  openModal: (modalId: string, forceReset?: boolean) => void;
  closeModal: (modalId: string, forceReset?: boolean) => void;
  shouldCloseModal: (modalId: string) => boolean;
  
  // Abfrage-Methoden
  getOperationByEntityId: (entityId: string, entityType: string) => EntityOperation | undefined;
  getOperationStatusForModal: (modalId: string) => OperationStatus;
  getOperationsByModalId: (modalId: string) => EntityOperation[];
  getOperationsByType: (entityType: string, operationType?: string) => EntityOperation[];
  
  // Wartung
  cleanupStaleOperations: (olderThanMs: number) => void;
}

// Erstellt einen eindeutigen Schlüssel für eine Operation basierend auf ihren Eigenschaften
const createOperationKey = (operation: { 
  id: string;
  entityType: string;
  operationType: string;
}): string => {
  return `${operation.entityType}-${operation.operationType}-${operation.id}`;
};

/**
 * Hauptimplementierung des Event-Stores mit allen Zustandsmanagement-Methoden
 */
export const useEventStore = create<EventStoreState>((set, get) => ({
  // Initialzustand
  operations: {},
  openModals: new Set(),
  
  /**
   * Startet eine neue Operation und gibt ihren eindeutigen Schlüssel zurück
   * 
   * @param operation Die Operationsdaten
   * @returns Eindeutiger Schlüssel der Operation für spätere Referenz
   */
  startOperation: (operation) => {
    console.log(`[EventStore] Starting operation: ${operation.entityType}-${operation.operationType}`, operation);
    
    const operationKey = createOperationKey(operation);
    
    set(state => {
      // Operation registrieren
      const newOperations = {
        ...state.operations,
        [operationKey]: {
          entityId: operation.id,
          entityType: operation.entityType,
          operationType: operation.operationType,
          modalId: operation.modalId,
          isPending: true,
          timestamp: Date.now(),
          data: operation.data || null
        },
      };
      
      return { operations: newOperations };
    });
    
    return operationKey;
  },
  
  /**
   * Schließt eine Operation ab (erfolgreich oder mit Fehler)
   * 
   * @param params Parameter für die Vervollständigung der Operation
   */
  completeOperation: (params) => {
    const { id, success, error, data, eventType } = params;
    const operationKey = createOperationKey({
      id,
      entityType: EntityType.CATEGORY, // Standardmäßig Kategorie
      operationType: OperationType.CREATE // Standardmäßig Erstellung
    });
    
    console.log(`[EventStore] Completing operation: ${operationKey}, success: ${success}`, params);
    
    set(state => {
      const operation = state.operations[operationKey];
      if (!operation) {
        console.warn(`[EventStore] Operation not found: ${operationKey}`);
        return state;
      }
      
      // Bei Erfolg: Operation entfernen und ggf. Modal schließen
      if (success) {
        const { [operationKey]: _, ...restOperations } = state.operations;
        
        // Bei erfolgreichem Abschluss das zugehörige Modal schließen
        let newOpenModals = new Set(state.openModals);
        if (operation.modalId) {
          console.log(`[EventStore] Auto-closing modal: ${operation.modalId}`);
          newOpenModals.delete(operation.modalId);
        }
        
        return {
          operations: restOperations,
          openModals: newOpenModals
        };
      } 
      
      // Bei Fehler: Operation mit Fehlerstatus markieren
      return {
        operations: {
          ...state.operations,
          [operationKey]: {
            ...operation,
            isPending: false,
            errorMessage: error ? error.message : "Unbekannter Fehler"
          }
        }
      };
    });
  },
  
  /**
   * Registriert ein geöffnetes Modal
   * 
   * @param modalId ID des Modals
   * @param forceReset Optional: Forciert das Zurücksetzen aller zugehörigen Operationen
   */
  openModal: (modalId, forceReset = false) => {
    console.log(`[EventStore] Opening modal: ${modalId}, forceReset: ${forceReset}`);
    
    // Wenn forceReset, dann lösche alle hängenden Operationen für dieses Modal
    if (forceReset) {
      set(state => {
        // Finde alle Operations, die zu diesem Modal gehören
        const newOperations = { ...state.operations };
        let changes = false;
        
        // Suche nach Operations mit dieser modalId
        Object.keys(newOperations).forEach(key => {
          if (newOperations[key].modalId === modalId) {
            console.log(`[EventStore] Zurücksetzen von hängender Operation für Modal ${modalId}: ${key}`);
            delete newOperations[key];
            changes = true;
          }
        });
        
        // Auch Operations mit diesem Präfix entfernen (zone-create-setup-zone-modal, etc.)
        const operationPrefix = `-${modalId}`;
        Object.keys(newOperations).forEach(key => {
          if (key.endsWith(operationPrefix)) {
            console.log(`[EventStore] Zurücksetzen von Operations mit Präfix für Modal ${modalId}: ${key}`);
            delete newOperations[key];
            changes = true;
          }
        });

        // Suche nach pending Operations für diesen Entity-Typ
        const entityTypePrefix = `zone-`;
        if (modalId.includes('zone')) {
          Object.keys(newOperations).forEach(key => {
            if (key.startsWith(entityTypePrefix) && key.includes('pending')) {
              console.log(`[EventStore] Zurücksetzen von pending Zone-Operation: ${key}`);
              delete newOperations[key];
              changes = true;
            }
          });
        }
        
        return {
          operations: changes ? newOperations : state.operations,
          openModals: new Set([...state.openModals, modalId])
        };
      });
    } else {
      // Normale Registrierung ohne Reset
      set(state => ({
        openModals: new Set([...state.openModals, modalId])
      }));
    }
  },
  
  /**
   * Markiert ein Modal als geschlossen
   * 
   * @param modalId ID des Modals
   * @param forceReset Optional: Forciert das Zurücksetzen aller zugehörigen Operationen
   */
  closeModal: (modalId, forceReset = false) => {
    console.log(`[EventStore] Closing modal: ${modalId}, forceReset: ${forceReset}`);
    
    if (forceReset) {
      set(state => {
        // Finde alle Operations, die zu diesem Modal gehören
        const newOperations = { ...state.operations };
        let changes = false;
        
        // Suche nach Operations mit dieser modalId
        Object.keys(newOperations).forEach(key => {
          if (newOperations[key].modalId === modalId) {
            console.log(`[EventStore] Zurücksetzen von hängender Operation beim Schließen von Modal ${modalId}: ${key}`);
            delete newOperations[key];
            changes = true;
          }
        });
        
        // Auch Operations mit diesem Präfix entfernen (zone-create-setup-zone-modal, etc.)
        const operationPrefix = `-${modalId}`;
        Object.keys(newOperations).forEach(key => {
          if (key.endsWith(operationPrefix)) {
            console.log(`[EventStore] Zurücksetzen von Operations mit Präfix beim Schließen von Modal ${modalId}: ${key}`);
            delete newOperations[key];
            changes = true;
          }
        });
        
        const newOpenModals = new Set(state.openModals);
        newOpenModals.delete(modalId);
        
        return { 
          operations: changes ? newOperations : state.operations,
          openModals: newOpenModals 
        };
      });
    } else {
      // Normales Schließen ohne Reset
      set(state => {
        const newOpenModals = new Set(state.openModals);
        newOpenModals.delete(modalId);
        return { openModals: newOpenModals };
      });
    }
  },
  
  /**
   * Prüft, ob ein Modal geschlossen werden sollte
   * (wird von UI-Komponenten aufgerufen, um auf automatische Schließungen zu reagieren)
   * 
   * @param modalId ID des Modals
   * @returns true, wenn das Modal geschlossen werden sollte
   */
  shouldCloseModal: (modalId) => {
    const openModals = get().openModals;
    return !openModals.has(modalId);
  },
  
  /**
   * Findet eine Operation anhand der Entity-ID und des Entity-Typs
   * 
   * @param entityId ID der Entity
   * @param entityType Typ der Entity
   * @returns Die Operation oder undefined, wenn nicht gefunden
   */
  getOperationByEntityId: (entityId, entityType) => {
    const operations = get().operations;
    return Object.values(operations).find(op => 
      op.entityId === entityId && op.entityType === entityType
    );
  },
  
  /**
   * Ermittelt den Status aller Operationen für ein bestimmtes Modal
   * 
   * @param modalId ID des Modals
   * @returns Konsolidierter Operationsstatus für UI-Feedback
   */
  getOperationStatusForModal: (modalId) => {
    const operations = Object.values(get().operations)
      .filter(op => op.modalId === modalId);
    
    if (operations.length === 0) {
      return { isPending: false, error: null, hasSucceeded: false };
    }
    
    const isPending = operations.some(op => op.isPending);
    const errorOperation = operations.find(op => op.errorMessage);
    
    return {
      isPending,
      error: errorOperation?.errorMessage || null,
      hasSucceeded: !isPending && !errorOperation
    };
  },
  
  /**
   * Gibt alle Operationen für ein bestimmtes Modal zurück
   * 
   * @param modalId ID des Modals
   * @returns Liste der zugehörigen Operationen
   */
  getOperationsByModalId: (modalId) => {
    const operations = get().operations;
    return Object.values(operations).filter(op => op.modalId === modalId);
  },
  
  /**
   * Gibt alle Operationen eines bestimmten Entity-Typs zurück
   * 
   * @param entityType Typ der Entity (z.B. 'category')
   * @param operationType Optionaler Operationstyp (z.B. 'create')
   * @returns Liste der zugehörigen Operationen
   */
  getOperationsByType: (entityType, operationType) => {
    const operations = get().operations;
    return Object.values(operations).filter(op => {
      if (op.entityType !== entityType) return false;
      if (operationType && op.operationType !== operationType) return false;
      return true;
    });
  },
  
  /**
   * Bereinigt veraltete Operationen, die hängen geblieben sind
   * 
   * @param olderThanMs Maximales Alter in Millisekunden
   */
  cleanupStaleOperations: (olderThanMs) => {
    const now = Date.now();
    set(state => {
      const newOperations = { ...state.operations };
      let hasChanges = false;
      
      Object.entries(newOperations).forEach(([key, operation]) => {
        if (operation.isPending && now - operation.timestamp > olderThanMs) {
          console.log(`[EventStore] Cleaning up stale operation: ${key}`);
          delete newOperations[key];
          hasChanges = true;
        }
      });
      
      return hasChanges ? { operations: newOperations } : state;
    });
  }
}));

/**
 * Hook für einfachen Zugriff auf den Event-Manager
 * Dies ist die empfohlene Methode, um auf den Event-Store zuzugreifen
 */
export function useEventManager(): EventStoreState {
  return useEventStore();
}