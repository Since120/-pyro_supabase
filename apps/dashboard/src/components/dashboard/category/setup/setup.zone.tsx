import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
// import { useApolloClient } from '@apollo/client'; // TEMPORÄR DEAKTIVIERT - Supabase-Migration
import { ZoneCreateInput } from '@/graphql/generated/graphql';
import { useZoneOperations } from '@/hooks/zone/use.zone.operations';
import { EventManagedModal } from '../../../common/EventManagedModal';
import { OperationStatusIndicator } from '../../../common/OperationStatusIndicator';

export interface CategoryOption {
  id: string;
  name: string;
}

interface SetupZoneProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: ZoneCreateInput) => void;
  categories: CategoryOption[];
}

// Eindeutige Modal-ID für den Event-Manager
const MODAL_ID = 'setup-zone-modal';

/**
 * Modal zur Erstellung einer neuen Zone mit Event-Manager-Integration
 */
const SetupZone: React.FC<SetupZoneProps> = ({ open, onClose, onSave, categories }) => {
  // Lokale Form-Zustände
  const [categoryId, setCategoryId] = useState<string>('');
  const [zoneKey, setZoneKey] = useState<string>('');
  const [zoneName, setZoneName] = useState<string>('');
  const [minutesRequired, setMinutesRequired] = useState<number>(5);
  const [pointsGranted, setPointsGranted] = useState<number>(10);
  
  // Zone-Operations-Hook (zentraler Hook)
  const { 
    createZone, 
    getModalOperationStatus 
  } = useZoneOperations();

  // Status der Operation für dieses Modal
  const modalStatus = getModalOperationStatus(MODAL_ID);

  // Formular zurücksetzen
  const handleReset = () => {
    setCategoryId('');
    setZoneKey('');
    setZoneName('');
    setMinutesRequired(5);
    setPointsGranted(10);
  };

  // Bei Schließen des Modals Formular zurücksetzen
  const handleClose = () => {
    onClose();
    setTimeout(handleReset, 500); // Mit Verzögerung zurücksetzen für bessere UX
  };

  // Form validation
  const isValid = () =>
    categoryId.trim() !== '' &&
    zoneKey.trim() !== '' &&
    zoneName.trim() !== '' &&
    minutesRequired > 0 &&
    pointsGranted > 0;

  // Erstellung einer Zone mit Event-Tracking
  const handleCreateZone = async () => {
    try {
      // Input-Objekt erstellen
      const input: ZoneCreateInput = {
        zoneKey,
        name: zoneName,
        minutesRequired,
        pointsGranted,
        totalSecondsInZone: 0,
        isDeletedInDiscord: false,
        categoryId,
      };
      
      console.log(`[SetupZone] Starte Zone-Erstellung mit Modal ID: ${MODAL_ID}`);
      
      // Zone erstellen und im Event-Manager tracken
      await createZone(input, {
        modalId: MODAL_ID,
        onSuccess: (data) => {
          console.log('[SetupZone] Zone-Erstellung erfolgreich gesendet:', data.id);
          
          // Callback für UI
          if (onSave) {
            onSave(input);
          }
          
          // Nichts tun - Modal ist bereits geschlossen, Benachrichtigung kommt später
        },
        onError: (error) => {
          console.error('[SetupZone] Fehler beim Erstellen der Zone:', error);
          // Fehler wird als Notification über den Event-Manager angezeigt
        }
      });
      
      // WICHTIG: Modal SOFORT schließen, ohne auf Backend-Antwort zu warten
      console.log('[SetupZone] Schließe Modal sofort nach Absenden der Anfrage');
      onClose();
      handleReset(); // Formular zurücksetzen
      
    } catch (error) {
      // Fehler wird bereits durch den createZone-Hook behandelt
      console.error('[SetupZone] Unerwarteter Fehler:', error);
      
      // Trotzdem Modal schließen bei Fehler
      onClose();
      handleReset();
    }
  };

  return (
    <EventManagedModal
      open={open}
      onClose={handleClose}
      modalId={MODAL_ID}
      title="Neue Zone hinzufügen"
    >
      {/* Operationsstatus-Anzeige */}
      <OperationStatusIndicator 
        isPending={modalStatus.isPending}
        error={modalStatus.error}
        modalId={MODAL_ID}
      />
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          select
          label="Kategorie auswählen"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          fullWidth
          disabled={modalStatus.isPending}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField 
          label="Zone-Schlüssel" 
          value={zoneKey} 
          onChange={(e) => setZoneKey(e.target.value)} 
          fullWidth
          disabled={modalStatus.isPending}
          helperText="Ein kurzes Kürzel für die Zone, z.B. 'CZ' für Contested Zone"
        />
        <TextField 
          label="Zone-Name" 
          value={zoneName} 
          onChange={(e) => setZoneName(e.target.value)} 
          fullWidth
          disabled={modalStatus.isPending}
        />
        <TextField
          label="Benötigte Zeit (Minuten) für Zielpunkte"
          type="number"
          value={minutesRequired}
          onChange={(e) => setMinutesRequired(Number(e.target.value))}
          fullWidth
          disabled={modalStatus.isPending}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <TextField
          label="Punkte pro Minute"
          type="number"
          value={pointsGranted}
          onChange={(e) => setPointsGranted(Number(e.target.value))}
          fullWidth
          disabled={modalStatus.isPending}
          InputProps={{ inputProps: { min: 0 } }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={onClose}
            disabled={modalStatus.isPending}
          >
            Abbrechen
          </Button>
          
          {modalStatus.isPending ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2">
                Erstelle Zone...
              </Typography>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleCreateZone} 
              disabled={!isValid()}
            >
              Erstellen
            </Button>
          )}
        </Box>
      </Box>
    </EventManagedModal>
  );
};

export default SetupZone;