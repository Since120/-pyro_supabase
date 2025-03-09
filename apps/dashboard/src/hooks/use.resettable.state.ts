// apps/dashboard/src/hooks/use.resettable.state.ts
import { useState, useEffect, useCallback } from 'react';

/**
 * useResettableState
 * Initialisiert einen Zustand mit einem Anfangswert und setzt ihn zurück,
 * wenn sich eine oder mehrere Abhängigkeiten ändern.
 *
 * @param initialValue - Der anfängliche Wert des Zustands.
 * @param deps - Abhängigkeiten, bei deren Änderung der Zustand zurückgesetzt wird.
 * @returns [state, setState, resetState] - Der Zustand, der State-Setter und eine Funktion zum manuellen Zurücksetzen
 */
export function useResettableState<T>(
  initialValue: T, 
  deps: any[] = []
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(initialValue);
  
  // Callback für manuelles Zurücksetzen
  const resetState = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);

  // Automatisches Zurücksetzen, wenn sich Abhängigkeiten ändern
  useEffect(() => {
    setState(initialValue);
  }, deps); // Wenn z.B. initialData oder open sich ändern, wird der Zustand zurückgesetzt

  return [state, setState, resetState];
}