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
  // Keine Timeouts mehr
  autoCloseTimeout = 0,
  // Keine automatische Schließung mehr
  disableAutoClose = true
}: EventManagedModalProps) {
  // NEU: Kein lokaler Open-State mehr, der vom Parent-State abweichen könnte
  // Stattdessen direkt den open-Prop verwenden
  
  const { openModal, closeModal } = useEventManager();
  
  // Ref zum Tracken, ob das Modal geschlossen wird
  const closingRef = useRef(false);

  // Bei Öffnen/Schließen des Modals direkt auf Änderungen reagieren
  useEffect(() => {
    console.log(`[EventManagedModal] Modal ${open ? 'geöffnet' : 'geschlossen'}: ${modalId}, open=${open}`);
    
    if (open) {
      // Reset bei Öffnen
      openModal(modalId, true);
      closingRef.current = false;
    } else {
      // Cleanup beim Schließen
      if (!closingRef.current) {
        closeModal(modalId, true);
        closingRef.current = true;
      }
    }
    
    return () => {
      if (open) {
        // Cleanup bei Unmount, wenn noch offen
        closeModal(modalId, true);
      }
    };
  }, [open, modalId, openModal, closeModal]);
  
  // Bei manueller Schließung direkt den onClose-Handler aufrufen
  const handleClose = () => {
    if (closingRef.current) {
      // Verhindere doppeltes Schließen
      return;
    }
    
    console.log(`[EventManagedModal] Manuelles Schließen initiiert: ${modalId}`);
    closingRef.current = true;
    
    // WICHTIG: Direkt den Parent-Handler aufrufen, keine lokalen State-Änderungen mehr
    onClose();
    
    // Event-Store aktualisieren
    closeModal(modalId, true);
  };
  
  return (
    <Modal
      open={open} // WICHTIG: Direkt den open-Prop verwenden, nicht den lokalen State
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