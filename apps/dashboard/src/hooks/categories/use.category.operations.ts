// src/hooks/categories/use.category.operations.ts
/**
 * Integrierter Hook für Kategorie-Operationen
 * 
 * Dies ist die zentrale Schnittstelle für die Arbeit mit Kategorie-Operationen.
 * Dieser Hook:
 * - Verwendet den Event-Manager im Hintergrund
 * - Bietet einheitliche Methoden für alle Kategorie-Operationen
 * - Unterstützt Tracking von modalen Zuständen und Operationen
 * - Gibt Events an den UI-Code zur Anzeige durch
 * 
 * HINWEIS: Dieser Hook ersetzt die älteren individuellen Hooks für
 * Kategorie-Operationen und -Events.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSupabaseCategories } from './use.supabase.categories';
import { useEventManager } from '../../services/EventManager';
import { EntityType, OperationType, CategoryEventType, operationIDs } from '../../services/EventManager/typeDefinitions';

// Types aus Supabase für Kategorien
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types';

interface CategoryOperationOptions {
  modalId?: string;               // ID des zugehörigen Modals (für Auto-Close)
  onSuccess?: (data: any) => void; // Callback bei Erfolg
  onError?: (error: any) => void;  // Callback bei Fehler
}

interface CategoryOperationResult {
  loading: boolean;               // Lädt die Operation?
  error: Error | null;            // Fehlerobjekt (falls vorhanden)
  data: any;                      // Rückgabedaten (falls vorhanden)
}

/**
 * Zentraler Hook für alle Kategorie-Operationen und -Events
 * Dies ist der neue, einheitliche Weg, um mit Kategorien zu arbeiten
 */
export function useCategoryOperations(guildId: string = '') {
  const { startOperation, completeOperation, getOperationStatusForModal } = useEventManager();
  
  // Supabase Kategorien-Hook anstelle von GraphQL
  const { 
    createCategory: supabaseCreateCategory, 
    updateCategory: supabaseUpdateCategory, 
    deleteCategory: supabaseDeleteCategory,
    isLoading
  } = useSupabaseCategories(guildId);

  /**
   * Zentrale Kategorie-Erstellungsmethode
   */
  const createCategory = useCallback(async (
    input: CreateCategoryInput, 
    options: CategoryOperationOptions = {}
  ) => {
    const { modalId, onSuccess, onError } = options;
    const operationId = operationIDs.category.create;
    
    try {
      // Operation starten
      startOperation({
        id: operationId,
        entityType: EntityType.CATEGORY,
        operationType: OperationType.CREATE,
        modalId,
        data: input
      });
      
      // Kategorie in Supabase erstellen
      const result = await supabaseCreateCategory(input);
      
      // Operation abschließen
      completeOperation({
        id: operationId,
        success: true,
        data: result,
        eventType: CategoryEventType.CREATED
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
        eventType: CategoryEventType.ERROR
      });
      
      // Error Callback aufrufen
      if (onError) onError(error);
      
      return { success: false, error };
    }
  }, [startOperation, completeOperation, supabaseCreateCategory]);

  /**
   * Zentrale Kategorie-Aktualisierungsmethode
   */
  const updateCategory = useCallback(async (
    id: string, 
    input: UpdateCategoryInput, 
    options: CategoryOperationOptions = {}
  ) => {
    const { modalId, onSuccess, onError } = options;
    const operationId = operationIDs.category.update;
    
    try {
      // Operation starten
      startOperation({
        id: operationId,
        entityType: EntityType.CATEGORY,
        operationType: OperationType.UPDATE,
        modalId,
        data: { id, ...input }
      });
      
      // Kategorie in Supabase aktualisieren
      const result = await supabaseUpdateCategory(id, input);
      
      // Operation abschließen
      completeOperation({
        id: operationId,
        success: true,
        data: result,
        eventType: CategoryEventType.UPDATED
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
        eventType: CategoryEventType.ERROR
      });
      
      // Error Callback aufrufen
      if (onError) onError(error);
      
      return { success: false, error };
    }
  }, [startOperation, completeOperation, supabaseUpdateCategory]);

  /**
   * Zentrale Kategorie-Löschmethode
   */
  const deleteCategory = useCallback(async (
    id: string, 
    options: CategoryOperationOptions = {}
  ) => {
    const { modalId, onSuccess, onError } = options;
    const operationId = operationIDs.category.delete;
    
    try {
      // Operation starten
      startOperation({
        id: operationId,
        entityType: EntityType.CATEGORY,
        operationType: OperationType.DELETE,
        modalId,
        data: { id }
      });
      
      // Kategorie in Supabase löschen
      const result = await supabaseDeleteCategory(id);
      
      // Operation abschließen
      completeOperation({
        id: operationId,
        success: true,
        data: result,
        eventType: CategoryEventType.DELETED
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
        eventType: CategoryEventType.ERROR
      });
      
      // Error Callback aufrufen
      if (onError) onError(error);
      
      return { success: false, error };
    }
  }, [startOperation, completeOperation, supabaseDeleteCategory]);

  return {
    // Operationen
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Status
    loading: isLoading,
    
    // Hilfsmethoden
    getModalOperationStatus: getOperationStatusForModal
  };
}

/**
 * Vereinfachter Hook für das Tracking einer einzelnen Kategorie-ID und zugehöriger Events
 * Nützlich für Komponenten, die nur eine bestimmte Kategorie beobachten müssen
 * 
 * @param categoryId ID der zu überwachenden Kategorie
 * @param options Zusätzliche Optionen
 */
export function useCategoryTracking(categoryId?: string | null, options: {
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