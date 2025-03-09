/**
 * Event-Manager Type-Definitionen
 * 
 * Diese Datei definiert alle gemeinsamen Typen für das Event-Management-System:
 * - Event-Typen für verschiedene Entitäten (angepasst an die API-Definitionen)
 * - Operation-Zustände und -Typen
 * - Gemeinsame Strukturen
 */

// Event-Typen für Kategorien
// Die Enum-Namen bleiben in UPPERCASE für TypeScript-Konvention,
// aber die Werte entsprechen exakt den API-Event-Typen (lowerCamelCase)
export enum CategoryEventType {
  CREATED = "created",
  CONFIRMATION = "confirmation",
  UPDATED = "updated",
  UPDATE_CONFIRMED = "updateConfirmed",
  DELETED = "deleted",
  DELETE_CONFIRMED = "deleteConfirmed",
  ERROR = "error",
  RATE_LIMIT = "rateLimit",
  QUEUED = "queued"
}

// Event-Typen für Zonen
// Gleiche Struktur und Namenskonvention wie bei Kategorien
export enum ZoneEventType {
  CREATED = "created",
  CONFIRMATION = "confirmation",
  UPDATED = "updated",
  UPDATE_CONFIRMED = "updateConfirmed",
  DELETED = "deleted",
  DELETE_CONFIRMED = "deleteConfirmed",
  ERROR = "error",
  RATE_LIMIT = "rateLimit",
  QUEUED = "queued"
}

// Kombinierter EventType für Operationen
export type EventType = CategoryEventType | ZoneEventType;

// Unterstützte Entity-Typen
export enum EntityType {
  CATEGORY = "category",
  ZONE = "zone"
}

// Unterstützte Operationstypen
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete"
}

// Standard-Operation-IDs für verschiedene Entitäten
export const operationIDs = {
  category: {
    create: 'category-create',
    update: 'category-update',
    delete: 'category-delete',
  },
  zone: {
    create: 'zone-create',
    update: 'zone-update',
    delete: 'zone-delete',
  }
};

// Struktur einer Entity-Operation
export interface EntityOperation {
  entityId: string;
  entityType: string;
  operationType: string;
  modalId?: string;
  isPending: boolean;
  timestamp: number;
  errorMessage?: string;
  data?: any; // Optionale Daten zur Operation
}

// Status einer Operation für die UI
export interface OperationStatus {
  isPending: boolean;
  error: string | null;
  hasSucceeded?: boolean;
  data?: any; // Optionale Daten zur Operation
}