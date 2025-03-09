# Event und Notification Management Guide

## 1. Grundprinzip: Zentrales Event- und Benachrichtigungssystem

- **Ein zentraler Event Manager** für alle Backend-Events
- **Einheitliche Benachrichtigungen** mit konsistentem Erscheinungsbild
- **Entkopplung von UI-Komponenten** und Event-Verarbeitung

## 2. Datei- und Ordnerstruktur

### Ordnerstruktur

```
src/
├── services/                     # Zentrale Dienste
│   ├── EventManager/             # Event-Management
│   │   ├── index.ts              # Hauptexport
│   │   ├── eventStore.ts         # Zustandsverwaltung
│   │   ├── eventSubscriber.ts    # Event-Abonnent
│   │   └── typeDefinitions.ts    # Typdefinitionen
│   │
│   └── NotificationManager/      # Benachrichtigungs-Management
│       ├── index.ts              # Hauptexport
│       └── notificationService.ts # Benachrichtigungslogik
│
├── components/                   # UI-Komponenten
│   ├── common/                   # Gemeinsame Komponenten
│   │   ├── EventManagedModal.tsx # Gemeinsame Modal-Komponente
│   │   └── OperationStatusIndicator.tsx # Status-Anzeige
```

### Dateibenennung

- **Zentrale Services**: CamelCase mit beschreibendem Namen (z.B. `eventStore.ts`)
- **Hooks**: mit `use` beginnen (z.B. `useEventManager.ts`)
- **Re-Exports**: `index.ts` für einfachen Import
- **Typdefinitionen**: `typeDefinitions.ts` oder in relevanten Service-Dateien

## 3. Event-Manager-Implementierung

### Typdefinitionen für den Event Manager

```typescript
// services/EventManager/typeDefinitions.ts

export interface EntityOperation {
  entityId: string;          // ID der Entität (Kategorie, Zone, etc.)
  entityType: string;        // Typ der Entität (category, zone, etc.)
  operationType: string;     // Art der Operation (create, update, delete)
  isPending: boolean;        // Ist die Operation noch in Bearbeitung?
  modalId: string;           // ID des zugehörigen Modals
  timestamp: number;         // Zeitstempel für Timeout-Behandlung
  errorMessage?: string;     // Fehlermeldung, falls vorhanden
}

export interface OperationStatus {
  isPending: boolean;        // Ist die Operation noch in Bearbeitung?
  error: string | null;      // Fehlermeldung, falls vorhanden
  hasSucceeded: boolean;     // Ist die Operation erfolgreich abgeschlossen?
}

// Definiert mögliche Event-Typen für Kategorien
export enum CategoryEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  CONFIRMATION = 'confirmation',
  UPDATE_CONFIRMED = 'updateConfirmed',
  DELETE_CONFIRMED = 'deleteConfirmed',
  ERROR = 'error',
  RATE_LIMIT = 'rateLimit',
  QUEUED = 'queued'
}

// Definiert mögliche Event-Typen für Zonen
// (Ähnlich zu CategoryEventType)
export enum ZoneEventType {
  // Ähnliche Definitionen...
}
```

### Zentraler Event Store

```typescript
// services/EventManager/eventStore.ts

import { create } from 'zustand';
import { EntityOperation, OperationStatus } from './typeDefinitions';

interface EventStoreState {
  // Alle laufenden Operationen
  operations: Record<string, EntityOperation>;
  
  // Alle offenen Modals
  openModals: Set<string>;
  
  // Methoden zum Hinzufügen und Aktualisieren von Operationen
  startOperation: (operation: Omit<EntityOperation, 'timestamp' | 'isPending'>) => string;
  completeOperation: (operationKey: string, success: boolean, errorMessage?: string) => void;
  
  // Methoden zur Modal-Steuerung
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  shouldCloseModal: (modalId: string) => boolean;
  
  // Hilfsmethoden
  getOperationByEntityId: (entityId: string, entityType: string) => EntityOperation | undefined;
  getOperationStatusForModal: (modalId: string) => OperationStatus;
  getOperationsByModalId: (modalId: string) => EntityOperation[];
  cleanupStaleOperations: (olderThanMs: number) => void;
}

// Erstelle einen eindeutigen Schlüssel für eine Operation
function createOperationKey(operation: Pick<EntityOperation, 'entityId' | 'entityType' | 'operationType'>): string {
  return `${operation.entityType}-${operation.operationType}-${operation.entityId}`;
}

// Event Store mit Zustand
export const useEventStore = create<EventStoreState>((set, get) => ({
  operations: {},
  openModals: new Set(),
  
  // Operation starten
  startOperation: (operation) => {
    const key = createOperationKey(operation);
    set(state => ({
      operations: {
        ...state.operations,
        [key]: {
          ...operation,
          isPending: true,
          timestamp: Date.now(),
        }
      }
    }));
    return key;
  },
  
  // Operation abschließen
  completeOperation: (operationKey, success, errorMessage) => {
    set(state => {
      const operation = state.operations[operationKey];
      if (!operation) return state;
      
      // Wenn die Operation erfolgreich war, können wir sie aus dem Zustand entfernen
      if (success) {
        const { [operationKey]: _, ...restOperations } = state.operations;
        
        // Bei erfolgreichem Abschluss das zugehörige Modal schließen
        let newOpenModals = new Set(state.openModals);
        if (operation.modalId) {
          newOpenModals.delete(operation.modalId);
        }
        
        return {
          operations: restOperations,
          openModals: newOpenModals
        };
      } 
      
      // Bei Fehler den Fehlerstatus aktualisieren
      return {
        operations: {
          ...state.operations,
          [operationKey]: {
            ...operation,
            isPending: false,
            errorMessage
          }
        }
      };
    });
  },
  
  // Modal öffnen
  openModal: (modalId) => {
    set(state => ({
      openModals: new Set([...state.openModals, modalId])
    }));
  },
  
  // Modal schließen
  closeModal: (modalId) => {
    set(state => {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.delete(modalId);
      return { openModals: newOpenModals };
    });
  },
  
  // Prüfen, ob ein Modal geschlossen werden sollte
  shouldCloseModal: (modalId) => {
    const openModals = get().openModals;
    return !openModals.has(modalId);
  },
  
  // Operation anhand der Entitäts-ID abrufen
  getOperationByEntityId: (entityId, entityType) => {
    const operations = get().operations;
    return Object.values(operations).find(op => 
      op.entityId === entityId && op.entityType === entityType
    );
  },
  
  // Status für ein bestimmtes Modal abrufen
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
  
  // Alle Operationen für ein bestimmtes Modal abrufen
  getOperationsByModalId: (modalId) => {
    const operations = get().operations;
    return Object.values(operations).filter(op => op.modalId === modalId);
  },
  
  // Veraltete Operationen bereinigen (z.B. für Timeout-Behandlung)
  cleanupStaleOperations: (olderThanMs) => {
    const now = Date.now();
    set(state => {
      const newOperations = { ...state.operations };
      let hasChanges = false;
      
      Object.entries(newOperations).forEach(([key, operation]) => {
        if (operation.isPending && now - operation.timestamp > olderThanMs) {
          delete newOperations[key];
          hasChanges = true;
        }
      });
      
      return hasChanges ? { operations: newOperations } : state;
    });
  }
}));

// Hook für einfachen Zugriff
export function useEventManager() {
  return useEventStore();
}
```

### Notification Manager

```typescript
// services/NotificationManager/notificationService.ts

import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

// Vordefinierte Benachrichtigungstypen
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Benachrichtigungsdauern
export enum NotificationDuration {
  SHORT = 3000,
  NORMAL = 5000,
  LONG = 8000
}

// Benachrichtigungsstruktur
interface NotificationOptions {
  variant?: VariantType;
  duration?: number;
  preventDuplicate?: boolean;
  persist?: boolean;
  key?: string | number;
}

// Set für bereits angezeigte Benachrichtigungen
const processedNotifications = new Set<string>();
const NOTIFICATION_TIMEOUT = 5000; // 5 Sekunden

export function useNotificationService() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // Eindeutigen Schlüssel für eine Benachrichtigung generieren
  const getNotificationKey = useCallback((entityId: string, eventType: string): string => {
    return `${entityId}-${eventType}`;
  }, []);

  // Prüfen, ob eine Benachrichtigung bereits angezeigt wurde
  const shouldShowNotification = useCallback((key: string): boolean => {
    if (processedNotifications.has(key)) {
      console.log(`[Notification] Doppelte Benachrichtigung unterdrückt: ${key}`);
      return false;
    }
    
    console.log(`[Notification] Neue Benachrichtigung: ${key}`);
    processedNotifications.add(key);
    
    // Nach 5 Sekunden aus dem Set entfernen
    setTimeout(() => {
      processedNotifications.delete(key);
      console.log(`[Notification] Benachrichtigungssperre für ${key} entfernt`);
    }, NOTIFICATION_TIMEOUT);
    
    return true;
  }, []);

  // Standardbenachrichtigungen für verschiedene Ereignisse
  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.SUCCESS,
      autoHideDuration: NotificationDuration.NORMAL,
      ...options
    });
  }, [enqueueSnackbar]);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.ERROR,
      autoHideDuration: NotificationDuration.LONG,
      ...options
    });
  }, [enqueueSnackbar]);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.WARNING,
      autoHideDuration: NotificationDuration.LONG,
      ...options
    });
  }, [enqueueSnackbar]);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    return enqueueSnackbar(message, {
      variant: NotificationType.INFO,
      autoHideDuration: NotificationDuration.NORMAL,
      ...options
    });
  }, [enqueueSnackbar]);

  // Hauptfunktion zur Anzeige von Benachrichtigungen mit Deduplizierung
  const showNotification = useCallback((
    entityId: string,
    eventType: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    options?: NotificationOptions
  ) => {
    const key = getNotificationKey(entityId, eventType);
    
    if (shouldShowNotification(key)) {
      const snackbarOptions = {
        key,
        variant: type,
        autoHideDuration: 
          type === NotificationType.ERROR || type === NotificationType.WARNING
            ? NotificationDuration.LONG
            : NotificationDuration.NORMAL,
        ...options
      };
      
      return enqueueSnackbar(message, snackbarOptions);
    }
    
    return null;
  }, [enqueueSnackbar, getNotificationKey, shouldShowNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    closeSnackbar
  };
}
```

### Event Subscriber

```typescript
// services/EventManager/eventSubscriber.ts

import { useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { useEventManager } from './eventStore';
import { useNotificationService, NotificationType } from '../NotificationManager/notificationService';
import { CategoryEventType, ZoneEventType } from './typeDefinitions';

// Importiere die GQL-Abfragen (diese kommen aus deinen generierten GraphQL-Typen)
import { 
  CATEGORY_EVENT_SUBSCRIPTION, 
  ZONE_EVENT_SUBSCRIPTION 
} from '../../graphql/subscriptions';

// Event-Konfigurations-Mapping
const eventNotificationConfigs = {
  // Kategorie-Events
  category: {
    [CategoryEventType.CREATED]: { 
      message: (name: string) => `Kategorie "${name}" wurde erstellt`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.CONFIRMATION]: { 
      message: (name: string) => `Kategorie "${name}" wurde in Discord erstellt`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.UPDATED]: { 
      message: (name: string) => `Kategorie "${name}" wurde aktualisiert`, 
      variant: NotificationType.INFO 
    },
    [CategoryEventType.UPDATE_CONFIRMED]: { 
      message: (name: string) => `Änderung an "${name}" wurde in Discord übernommen`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.DELETED]: { 
      message: (name: string) => `Kategorie "${name}" wurde gelöscht`, 
      variant: NotificationType.INFO 
    },
    [CategoryEventType.DELETE_CONFIRMED]: { 
      message: () => `Kategorie wurde aus Discord entfernt`, 
      variant: NotificationType.SUCCESS 
    },
    [CategoryEventType.ERROR]: { 
      message: (_, error: string) => `Fehler: ${error}`, 
      variant: NotificationType.ERROR, 
      duration: NotificationDuration.LONG 
    },
    [CategoryEventType.RATE_LIMIT]: { 
      message: (name: string, details: any) => {
        const delayMinutes = details?.delayMinutes || Math.ceil((details?.delayMs || 0) / 60000);
        return `Discord Rate Limit: Änderung an "${name}" wird in ${delayMinutes} Minute(n) durchgeführt`;
      }, 
      variant: NotificationType.WARNING, 
      duration: NotificationDuration.LONG 
    }
  },
  // Zone-Events folgen dem gleichen Schema
  zone: {
    // Ähnliche Konfigurationen für ZoneEventType...
  }
};

export function useEventSubscriber() {
  const apolloClient = useApolloClient();
  const { completeOperation, getOperationByEntityId } = useEventManager();
  const { showNotification } = useNotificationService();
  
  useEffect(() => {
    // Abonniere Category Events
    const categorySubscription = apolloClient.subscribe({
      query: CATEGORY_EVENT_SUBSCRIPTION
    }).subscribe({
      next({ data }) {
        if (!data?.categoryEvent) return;
        
        const event = data.categoryEvent;
        console.log(`Kategorie-Event empfangen: ${event.eventType} für ${event.id}`);
        
        // Finde die entsprechende Operation (wenn vorhanden)
        const operation = getOperationByEntityId(event.id, 'category');
        
        // Wähle die passende Konfiguration für diesen Event-Typ
        const config = eventNotificationConfigs.category[event.eventType as CategoryEventType];
        
        // Wenn eine Konfiguration vorhanden ist, zeige eine Benachrichtigung an
        if (config) {
          // Extrahiere Details aus dem Event, falls vorhanden
          let details = {};
          try {
            if (event.details) {
              details = JSON.parse(event.details);
            }
          } catch (e) {
            console.error('Fehler beim Parsen der Event-Details:', e);
          }
          
          // Zeige die Benachrichtigung an
          showNotification(
            event.id,
            event.eventType,
            typeof config.message === 'function' 
              ? config.message(event.name, details) 
              : config.message,
            config.variant,
            { autoHideDuration: config.duration }
          );
        }
        
        // Verarbeite den Event-Typ
        switch(event.eventType) {
          case CategoryEventType.CONFIRMATION:
            // Bestätigungsstatus setzen, wenn eine Operation existiert
            if (operation) {
              completeOperation(
                `category-create-${event.id}`, 
                true
              );
            }
            break;
            
          case CategoryEventType.UPDATE_CONFIRMED:
            // Update-Bestätigung
            if (operation) {
              completeOperation(
                `category-update-${event.id}`, 
                true
              );
            }
            break;
            
          case CategoryEventType.DELETE_CONFIRMED:
            // Löschbestätigung
            if (operation) {
              completeOperation(
                `category-delete-${event.id}`, 
                true
              );
            }
            break;
            
          case CategoryEventType.ERROR:
            // Fehlerbehandlung
            if (operation) {
              completeOperation(
                `category-${operation.operationType}-${event.id}`, 
                false, 
                event.error || 'Unbekannter Fehler'
              );
            }
            break;
            
          // Weitere Event-Typen...
        }
      },
      error(err) {
        console.error('Fehler in der Kategorie-Subscription:', err);
      }
    });
    
    // Ähnliches Abonnement für Zone-Events
    const zoneSubscription = apolloClient.subscribe({
      query: ZONE_EVENT_SUBSCRIPTION
    }).subscribe({
      next({ data }) {
        if (!data?.zoneEvent) return;
        
        const event = data.zoneEvent;
        // Ähnliche Verarbeitung für Zone-Events...
      },
      error(err) {
        console.error('Fehler in der Zone-Subscription:', err);
      }
    });
    
    // Timeout-Behandlung für hängengebliebene Operationen
    const timeoutInterval = setInterval(() => {
      useEventManager.getState().cleanupStaleOperations(30000); // 30 Sekunden
    }, 5000);
    
    // Cleanup bei Komponentenentfernung
    return () => {
      categorySubscription.unsubscribe();
      zoneSubscription.unsubscribe();
      clearInterval(timeoutInterval);
    };
  }, [apolloClient, completeOperation, getOperationByEntityId, showNotification]);
}
```

### Provider-Komponente

```typescript
// services/EventManager/index.ts

import React from 'react';
import { useEventSubscriber } from './eventSubscriber';
import { useEventManager } from './eventStore';
import { useNotificationService } from '../NotificationManager/notificationService';

// Re-export wichtiger Funktionen
export { useEventManager } from './eventStore';
export { useNotificationService } from '../NotificationManager/notificationService';
export * from './typeDefinitions';

// Provider-Komponente für globale Event-Verwaltung
export function EventManagerProvider({ children }: { children: React.ReactNode }) {
  // Event-Subscriber initialisieren
  useEventSubscriber();
  
  return <>{children}</>;
}
```

## 4. UI-Komponenten-Integration

### Gemeinsame Modal-Komponente

```typescript
// components/common/EventManagedModal.tsx

import React, { useEffect } from 'react';
import { Modal, Box, Typography } from '@mui/material';
import { useEventManager } from '../../services/EventManager';

interface EventManagedModalProps {
  open: boolean;
  onClose: () => void;
  modalId: string;
  title: string;
  children: React.ReactNode;
}

export function EventManagedModal({ 
  open, 
  onClose, 
  modalId, 
  title, 
  children 
}: EventManagedModalProps) {
  const { openModal, closeModal, shouldCloseModal } = useEventManager();
  
  // Bei Öffnen des Modals im zentralen Zustand registrieren
  useEffect(() => {
    if (open) {
      openModal(modalId);
    }
  }, [open, modalId, openModal]);
  
  // Überwachen, ob das Modal geschlossen werden sollte
  useEffect(() => {
    if (open && shouldCloseModal(modalId)) {
      onClose();
    }
  }, [modalId, onClose, open, shouldCloseModal]);
  
  // Bei manueller Schließung den Event-Manager informieren
  const handleClose = () => {
    closeModal(modalId);
    onClose();
  };
  
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby={`modal-${modalId}-title`}
    >
      <Box sx={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 600 },
        maxWidth: '95%',
        bgcolor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 24,
        p: { xs: 2, sm: 4 },
      }}>
        <Typography id={`modal-${modalId}-title`} variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        {children}
      </Box>
    </Modal>
  );
}
```

### Status-Indikator-Komponente

```typescript
// components/common/OperationStatusIndicator.tsx

import React from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

interface OperationStatusIndicatorProps {
  isPending: boolean;
  error: string | null;
  modalId: string;
}

export function OperationStatusIndicator({ 
  isPending, 
  error, 
  modalId 
}: OperationStatusIndicatorProps) {
  if (!isPending && !error) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : isPending ? (
        <Alert 
          severity="info"
          icon={<CircularProgress size={20} />}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">
              Wird verarbeitet...
            </Typography>
          </Box>
        </Alert>
      ) : null}
    </Box>
  );
}
```

## 5. Verwendungsbeispiele

### Integration in App

```tsx
// src/app.tsx oder src/pages/_app.tsx

import { SnackbarProvider } from 'notistack';
import { EventManagerProvider } from './services/EventManager';

function MyApp({ Component, pageProps }) {
  return (
    <SnackbarProvider maxSnack={5}>
      <EventManagerProvider>
        <Component {...pageProps} />
      </EventManagerProvider>
    </SnackbarProvider>
  );
}

export default MyApp;
```

### Vereinfachtes Modal-Beispiel

```tsx
// components/dashboard/category/setup/setup.category.tsx

import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import { EventManagedModal } from '../../../common/EventManagedModal';
import { OperationStatusIndicator } from '../../../common/OperationStatusIndicator';
import { useEventManager } from '../../../../services/EventManager';
import { useCreateCategory } from '../../../../hooks/categories/use.create.categories';

// Eindeutige Modal-ID
const MODAL_ID = 'setup-category-modal';

export default function SetupCategory({ open, onClose }) {
  // Event-Manager verwenden für Operationsverfolgung
  const { startOperation, getOperationStatusForModal } = useEventManager();
  const { isPending, error } = getOperationStatusForModal(MODAL_ID);
  
  // API-Mutation
  const { createCategory } = useCreateCategory();
  
  // Lokale Formularfelder (nur UI-Zustand)
  const [categoryName, setCategoryName] = useState('');
  // ... weitere Felder
  
  // Kategorieerstellen-Funktion
  const handleCreateCategory = async () => {
    // Beispiel-Input
    const input = {
      name: categoryName,
      // ... weitere Felder
    };
    
    // Operation im Event-Manager starten
    startOperation({
      entityType: 'category',
      operationType: 'create',
      modalId: MODAL_ID,
      entityId: '' // Wird nach erfolgreicher Erstellung aktualisiert
    });
    
    // GraphQL-Mutation ausführen
    try {
      const result = await createCategory({ variables: { input } });
      
      if (result.data?.createCategory) {
        // Operation mit korrekter ID aktualisieren
        startOperation({
          entityType: 'category',
          operationType: 'create',
          modalId: MODAL_ID,
          entityId: result.data.createCategory.id
        });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
    }
  };
  
  return (
    <EventManagedModal
      open={open}
      onClose={onClose}
      modalId={MODAL_ID}
      title="Neue Kategorie erstellen"
    >
      {/* Status-Anzeige */}
      <OperationStatusIndicator 
        isPending={isPending}
        error={error}
        modalId={MODAL_ID}
      />
      
      {/* Formularfelder */}
      {/* ... */}
      
      {/* Aktionsbuttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          disabled={isPending}
          sx={{ mr: 1 }}
        >
          Abbrechen
        </Button>
        
        <Button 
          variant="contained" 
          onClick={handleCreateCategory}
          disabled={isPending}
        >
          Erstellen
        </Button>
      </Box>
    </EventManagedModal>
  );
}
```

## 6. Migration von bestehenden Komponenten

### Schrittweise Vorgehensweise

1. **Zentrale Dienste einrichten**:
   - Event-Manager implementieren
   - Notification-Manager implementieren
   - Provider in die App integrieren

2. **Eine Modal-Komponente migrieren**:
   - Entfernen der eigenen Event-Subscription
   - Entfernen der eigenen Notification-Logik
   - Verwenden der gemeinsamen Modal-Komponente
   - Verwenden des Event-Managers für Operationen

3. **Weitere Komponenten migrieren**:
   - Einen ähnlichen Prozess für andere Modals durchführen

### Beispiel für eine Migration (vor und nach)

**Vorher**:
```tsx
// Alte Version mit viel Event-Handling-Logik und eigenen Subscriptions
function OldSetupCategory({ open, onClose }) {
  const [pendingCategoryId, setPendingCategoryId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState(null);
  // ... viele weitere Zustände
  
  // Event-Subscription
  useCategoryEvents({
    watchId: pendingCategoryId,
    onConfirmation: (event) => {
      // ... komplexe Logik
    },
    onError: (event) => {
      // ... mehr komplexe Logik
    }
    // ... weitere Event-Handler
  });
  
  // ... viele weitere Funktionen
}
```

**Nachher**:
```tsx
// Neue Version mit dem Event Manager
function NewSetupCategory({ open, onClose }) {
  // Event Manager für Status und Operationen
  const { startOperation, getOperationStatusForModal } = useEventManager();
  const { isPending, error } = getOperationStatusForModal('setup-category-modal');
  
  // Kategorie-Erstellung
  const handleCreateCategory = async () => {
    // Operation starten
    startOperation({
      entityType: 'category',
      operationType: 'create',
      modalId: 'setup-category-modal',
      entityId: ''
    });
    
    // API-Aufruf...
  };
  
  // ... Rendering mit gemeinsamen Komponenten
}
```

## 7. Wichtige Faustregeln

1. **Ein Event-Manager für alle Event-Typen**: Verwende den zentralen Event-Manager für alle API-Events
2. **Komponenten nur für UI-Zustand**: UI-Komponenten sollten nur UI-bezogenen Zustand verwalten
3. **Konsistente Benachrichtigungen**: Alle Benachrichtigungen sollten über den Notification-Manager erfolgen
4. **Klare Trennung von Zuständigkeiten**: Der Event-Manager kümmert sich um Events, die UI um Darstellung
5. **Timeout-Behandlung zentralisieren**: Timeouts für hängengebliebene Operationen werden zentral verwaltet
6. **Duplizierung vermeiden**: Verwende gemeinsame Komponenten für modale Dialoge und Status-Anzeigen
7. **Event-Typen standardisieren**: Verwende definierte Enum-Werte für Event-Typen