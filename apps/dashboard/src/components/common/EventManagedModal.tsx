// Anpassung von EventManagedModal.tsx, um die automatische Schließfunktion zu deaktivieren
// und stattdessen explizites Schließen über den onClose-Handler zu ermöglichen

import React, { useEffect, useState, useRef } from 'react';
import { Modal, Box, Typography } from '@mui/material';
import { useEventManager } from '../../services/EventManager';

interface EventManagedModalProps {
  open: boolean;
  onClose: () => void;
  modalId: string;
  title: string;
  children: React.ReactNode;
  // Neue Option: automatisches Schließen nach Timeout
  autoCloseTimeout?: number;
  // Neue Option: automatisches Schließen bei Event deaktivieren
  disableAutoClose?: boolean;
}

export function EventManagedModal({ 
  open, 
  onClose, 
  modalId, 
  title, 
  children, 
  // Standardmäßig 120 Sekunden (2 Minuten) Timeout
  autoCloseTimeout = 120000,
  // Standardmäßig ist automatisches Schließen deaktiviert (neuer Ansatz)
  disableAutoClose = false
}: EventManagedModalProps) {
  const { openModal, closeModal, shouldCloseModal, getOperationStatusForModal } = useEventManager();
  const [localOpen, setLocalOpen] = useState(open);
  
  // Ref zum Tracken, ob das Modal durch Event oder manuell geschlossen wird
  const closingRef = useRef({
    isClosing: false,
    isEventTriggered: false
  });

  // Timeout-Ref für automatisches Schließen
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Bei Öffnen des Modals im zentralen Zustand registrieren
  useEffect(() => {
    if (open) {
      console.log(`[EventManagedModal] Modal geöffnet: ${modalId}`);
      
      // WICHTIG: Verwende forceReset=true, um alle hängenden Operationen zurückzusetzen
      // Dies behebt das Problem mit dem persistenten Spinner-Status
      openModal(modalId, true);
      setLocalOpen(true);
      
      // Reset closing state
      closingRef.current = {
        isClosing: false,
        isEventTriggered: false
      };
      
      // Setze Timeout für automatisches Schließen
      if (autoCloseTimeout > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          console.log(`[EventManagedModal] Auto-Close Timeout für Modal: ${modalId}`);
          
          // Prüfe, ob das Modal immer noch geöffnet ist und eine laufende Operation hat
          const status = getOperationStatusForModal(modalId);
          
          if (localOpen && status.isPending) {
            console.log(`[EventManagedModal] Modal hat eine hängende Operation - schließe nach Timeout: ${modalId}`);
            
            // Markiere als schließend und rufe onClose auf
            closingRef.current = {
              isClosing: true,
              isEventTriggered: true
            };
            
            // Lokal schließen
            setLocalOpen(false);
            
            // Im Event-Manager schließen
            closeModal(modalId, true); // true = force reset
            
            // onClose-Handler aufrufen
            setTimeout(() => {
              onClose();
            }, 50);
          }
        }, autoCloseTimeout);
      }
    }
    
    // Cleanup-Function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [open, modalId, openModal, autoCloseTimeout, getOperationStatusForModal]);
  
  // Überwachen, ob das Modal geschlossen werden sollte - NUR wenn disableAutoClose=false
  useEffect(() => {
    // Wenn automatisches Schließen deaktiviert ist, diesen Effect überspringen
    if (disableAutoClose) return;
    
    // Prüfe, ob das Modal geschlossen werden sollte (basierend auf Event-Store)
    if (open && shouldCloseModal(modalId) && !closingRef.current.isClosing) {
      console.log(`[EventManagedModal] Modal sollte basierend auf Event geschlossen werden: ${modalId}`);
      
      // Markiere, dass das Schließen durch Event ausgelöst wurde
      closingRef.current = {
        isClosing: true,
        isEventTriggered: true
      };
      
      // Wir verwenden hier eine leichte Verzögerung, um sicherzustellen, dass
      // alle anderen Aktualisierungen (z.B. Tabellen-Refresh) abgeschlossen sind
      setTimeout(() => {
        setLocalOpen(false);
        // Danach rufe onClose auf, aber mit Verzögerung, damit setLocalOpen erst wirken kann
        setTimeout(() => {
          console.log(`[EventManagedModal] Rufe onClose-Handler auf für: ${modalId}`);
          onClose();
        }, 50);
      }, 100);
    }
  }, [modalId, onClose, open, shouldCloseModal, disableAutoClose]);
  
  // Status regelmäßig prüfen - NUR wenn disableAutoClose=false
  useEffect(() => {
    // Wenn automatisches Schließen deaktiviert ist, diesen Effect überspringen
    if (disableAutoClose) return;
    
    // Prüfe alle 5 Sekunden, ob der Modal-Status aktualisiert werden muss
    const intervalId = setInterval(() => {
      if (open && localOpen) {
        const status = getOperationStatusForModal(modalId);
        
        // Wenn wir einen Fehler haben oder die Operation abgeschlossen ist
        if (!status.isPending && (status.error || status.hasSucceeded)) {
          console.log(`[EventManagedModal] Statusänderung erkannt für Modal: ${modalId}`, status);
          
          // Bei Erfolg und nicht explizit geschlossen: Modal schließen
          if (status.hasSucceeded && !status.error) {
            console.log(`[EventManagedModal] Operation erfolgreich, schließe Modal: ${modalId}`);
            
            // Kleine Verzögerung, damit die UI aktualisiert werden kann
            setTimeout(() => {
              if (!closingRef.current.isClosing) {
                closingRef.current = {
                  isClosing: true,
                  isEventTriggered: true
                };
                
                closeModal(modalId, true); // true = force reset
                setLocalOpen(false);
                
                // Sofortiger Aufruf des onClose-Handlers ohne Verzögerung
                onClose();
              }
            }, 100); // Verzögerung von 500ms auf 100ms reduziert
          }
        }
      }
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [modalId, open, localOpen, getOperationStatusForModal, closeModal, onClose, disableAutoClose]);
  
  // Bei manueller Schließung den Event-Manager informieren
  const handleClose = () => {
    if (closingRef.current.isClosing) {
      // Verhindere doppeltes Schließen
      return;
    }
    
    console.log(`[EventManagedModal] Manuelles Schließen initiiert: ${modalId}`);
    closingRef.current = {
      isClosing: true,
      isEventTriggered: false
    };
    
    // Zuerst im Event-Store markieren
    closeModal(modalId, true); // true = force reset für sicheres Schließen
    
    // Dann erst UI-Zustand aktualisieren
    setLocalOpen(false);
    
    // Mit leichter Verzögerung den Close-Handler aufrufen
    setTimeout(() => {
      console.log(`[EventManagedModal] Führe onClose für manuelles Schließen aus: ${modalId}`);
      onClose();
    }, 50);
  };
  
  return (
    <Modal
      open={localOpen}
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