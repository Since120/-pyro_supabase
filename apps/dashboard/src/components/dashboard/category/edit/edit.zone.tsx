// Optimiertes edit.zone.tsx mit sofortigem Modal-Schließen
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  MenuItem, 
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
// import { useApolloClient } from '@apollo/client'; // TEMPORÄR DEAKTIVIERT - Supabase-Migration
import { useZoneOperations } from '@/hooks/zone/use.zone.operations';
import { useResettableState } from '@/hooks/use.resettable.state';
import { EventManagedModal } from '../../../common/EventManagedModal';
import { OperationStatusIndicator } from '../../../common/OperationStatusIndicator';

export interface EditZoneData {
  category: string;
  zoneKey: string;
  zoneName: string;
  minutesRequired: number;
  pointsGranted: number;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface EditZoneInitialData {
  id: string;
  category?: { id: string; name: string };
  categoryId?: string;
  zoneKey: string;
  zoneName?: string;
  name?: string;
  minutesRequired: number;
  pointsGranted: number;
}

interface EditZoneProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: EditZoneData) => void;
  onDelete?: () => void;
  categories: CategoryOption[];
  initialData?: EditZoneInitialData;
}

// Eindeutige Modal-ID für den Event-Manager
const MODAL_ID = 'edit-zone-modal';

/**
 * Modal zum Bearbeiten einer Zone mit sofortigem Schließen
 */
const EditZone: React.FC<EditZoneProps> = ({ open, onClose, onSave, onDelete, categories, initialData }) => {
  const theme = useTheme();
  // const apolloClient = useApolloClient(); // TEMPORÄR DEAKTIVIERT - Supabase-Migration
  
  // Zustandsverwaltung via useResettableState
  const [category, setCategory] = useResettableState(
    (initialData?.category?.id || initialData?.categoryId) || '',
    [initialData, open]
  );
  const [zoneKey, setZoneKey] = useResettableState(initialData?.zoneKey || '', [initialData, open]);
  const [zoneName, setZoneName] = useResettableState(initialData?.zoneName || initialData?.name || '', [initialData, open]);
  const [minutesRequired, setMinutesRequired] = useResettableState(initialData?.minutesRequired || 0, [initialData, open]);
  const [pointsGranted, setPointsGranted] = useResettableState(initialData?.pointsGranted || 0, [initialData, open]);

  // Zone-Operations-Hook (zentraler Hook)
  const { 
    updateZone, 
    deleteZone,
    getModalOperationStatus 
  } = useZoneOperations();

  // Status der Operation für dieses Modal
  const modalStatus = getModalOperationStatus(MODAL_ID);

  // Formularvalidierung
  const isValid = () =>
    category.trim() !== '' &&
    zoneKey.trim() !== '' &&
    zoneName.trim() !== '' &&
    minutesRequired > 0 &&
    pointsGranted > 0;

  // Update-Zone-Funktion mit sofortigem Schließen
  const handleSave = async () => {
    if (!initialData?.id) {
      return;
    }

    try {
      // Update-Daten zusammenstellen
      const updateData = {
        zoneKey,
        name: zoneName,
        minutesRequired,
        pointsGranted,
        categoryId: category,
      };

      // Führe die Update-Operation aus und tracke sie im Event-Manager
      await updateZone(initialData.id, updateData, {
        modalId: MODAL_ID,
        onSuccess: (data) => {
          console.log('[EditZone] Zone erfolgreich aktualisiert:', data);
          
          // Ursprüngliches onSave bleibt erhalten
          if (onSave) {
            onSave({
              category,
              zoneKey,
              zoneName,
              minutesRequired,
              pointsGranted
            });
          }
          
          // Das Modal ist bereits geschlossen, Benachrichtigung kommt später vom EventSubscriber
        }
      });
      
      // WICHTIG: Modal SOFORT schließen, ohne auf Backend-Antwort zu warten
      console.log('[EditZone] Schließe Modal sofort nach Absenden der Änderungen');
      onClose();
      
    } catch (error) {
      console.error('[EditZone] Fehler beim Aktualisieren der Zone:', error);
      // Fehlerbehandlung erfolgt automatisch durch den Event-Manager
      
      // Bei Fehler ebenfalls sofort schließen
      onClose();
    }
  };

  // Lösch-Funktion mit sofortigem Schließen
  const handleDelete = async () => {
    if (!initialData?.id) {
      return;
    }

    try {
      console.log(`[EditZone] Starte Löschung für Zone ID: ${initialData.id}, Modal ID: ${MODAL_ID}`);
      
      // Führe die Lösch-Operation aus und tracke sie im Event-Manager
      await deleteZone(initialData.id, {
        modalId: MODAL_ID,
        onSuccess: (data) => {
          console.log('[EditZone] Zone-Löschung initiiert:', data);
          
          // Daten sofort aktualisieren
          // apolloClient.refetchQueries({ // TEMPORÄR DEAKTIVIERT - Supabase-Migration
          //   include: ["GetZones"]
          // });
          
          // Ursprüngliches onDelete aufrufen
          if (onDelete) {
            onDelete();
          }
          
          // Das Modal ist bereits geschlossen, Benachrichtigung kommt später vom EventSubscriber
        }
      });
      
      // WICHTIG: Modal SOFORT schließen, ohne auf Backend-Antwort zu warten
      console.log('[EditZone] Schließe Modal sofort nach Absenden der Löschanfrage');
      onClose();
      
    } catch (error) {
      console.error('[EditZone] Fehler beim Löschen der Zone:', error);
      // Fehlerbehandlung erfolgt automatisch durch den Event-Manager
      
      // Bei Fehler ebenfalls sofort schließen
      onClose();
    }
  };

  return (
    <EventManagedModal
      open={open}
      onClose={onClose}
      modalId={MODAL_ID}
      title="Zone bearbeiten"
    >
      {/* Operationsstatus-Anzeige */}
      <OperationStatusIndicator 
        isPending={modalStatus.isPending}
        error={modalStatus.error}
        modalId={MODAL_ID}
      />
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Dropdown zum Auswählen der Kategorie */}
        <TextField
          select
          label="Kategorie auswählen"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleDelete}
            disabled={modalStatus.isPending}
          >
            Löschen
          </Button>
          
          {modalStatus.isPending ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body1">
                Wird verarbeitet...
              </Typography>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={!isValid()}
            >
              Speichern
            </Button>
          )}
        </Box>
      </Box>
    </EventManagedModal>
  );
};

export default EditZone;