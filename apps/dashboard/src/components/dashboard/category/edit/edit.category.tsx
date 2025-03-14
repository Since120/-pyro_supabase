// Optimiertes edit.category.tsx mit sofortigem Modal-Schließen
import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  ButtonGroup,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import PickerTextField from '../../../core/picker.text.field';
import DiscordRoleSelect from '../../../core/discord.role.select';
import { EditCategoryData } from '../types';
import { useResettableState } from '@/hooks/use.resettable.state';
import { EventManagedModal } from '../../../common/EventManagedModal';
import { OperationStatusIndicator } from '../../../common/OperationStatusIndicator';
import { useCategoryOperations } from '@/hooks/categories/use.category.operations';

// Eindeutige Modal-ID für den Event-Manager
const MODAL_ID = 'edit-category-modal';

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: EditCategoryData) => void;
  onDelete?: () => void;
  initialData?: EditCategoryData & { id: string };
}

/**
 * Modal zum Bearbeiten einer Kategorie
 * Verwendet sofortiges Schließen statt auf Backend-Antwort zu warten
 */
const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ open, onClose, onSave, onDelete, initialData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Zustandsverwaltung via useResettableState
  const [selectedLevel, setSelectedLevel] = useResettableState(initialData?.selectedLevel || '', [initialData, open]);
  const [categoryName, setCategoryName] = useResettableState(initialData?.categoryName || '', [initialData, open]);
  const [role, setRole] = useResettableState<string[]>(initialData?.role || [], [initialData, open]);
  const [tracking, setTracking] = useResettableState(initialData?.tracking || false, [initialData, open]);
  const [visible, setVisible] = useResettableState(initialData?.visible || false, [initialData, open]);
  const [sendSetup, setSendSetup] = useResettableState(initialData?.sendSetup || false, [initialData, open]);

  // Verwende den zentralen Category-Operations-Hook
  const { 
    updateCategory, 
    deleteCategory, 
    getModalOperationStatus 
  } = useCategoryOperations();

  // Hole den aktuellen Operationsstatus für dieses Modal
  const modalStatus = getModalOperationStatus(MODAL_ID);

  // Formularvalidierung
  const isValid = () =>
    selectedLevel.trim() !== '' && categoryName.trim() !== '' && role.length > 0;

  // Handler für Schließen des Modals
  const handleClose = () => {
    console.log('[EditCategory] Modal wird geschlossen');
    onClose();
  };

  // Update-Kategorie-Funktion mit sofortigem Schließen
  const handleSave = async () => {
    if (!initialData?.id) {
      return;
    }

    try {
      console.log('[EditCategory] Speichere Kategorie-Änderungen für ID:', initialData.id);
      
      // Update-Daten zusammenstellen
      const updateData = {
        id: initialData.id,
        name: categoryName,
        categoryType: selectedLevel,
        isVisible: visible,
        isTrackingActive: tracking,
        isSendSetup: sendSetup,
        allowedRoles: role,
      };

      // Führe die Update-Operation aus und tracke sie im Event-Manager
      await updateCategory(initialData.id, updateData, {
        modalId: MODAL_ID,
        onSuccess: (data) => {
          console.log('[EditCategory] Kategorie erfolgreich aktualisiert:', data);
          
          // Ursprüngliches onSave bleibt erhalten
          if (onSave) {
            onSave({
              selectedLevel,
              categoryName,
              role,
              tracking,
              visible,
              sendSetup,
            });
          }
          
          // Das Modal ist bereits geschlossen, Benachrichtigung kommt später vom EventSubscriber
        }
      });
      
      // WICHTIG: Modal SOFORT schließen, ohne auf Backend-Antwort zu warten
      console.log('[EditCategory] Schließe Modal sofort nach Absenden der Änderungen');
      onClose();
      
    } catch (error) {
      console.error('[EditCategory] Fehler beim Aktualisieren der Kategorie:', error);
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
      console.log('[EditCategory] Lösche Kategorie mit ID:', initialData.id);
      
      // Debug-Ausgabe
      console.log('[EditCategory] Kategorie-Details:', initialData);
      
      // Führe die Lösch-Operation aus und tracke sie im Event-Manager
      const result = await deleteCategory(initialData.id, {
        modalId: MODAL_ID,
        onSuccess: () => {
          console.log('[EditCategory] Kategorie erfolgreich gelöscht');
          
          // Ursprüngliches onDelete bleibt erhalten
          if (onDelete) {
            onDelete();
          }
          
          // Das Modal ist bereits geschlossen, Benachrichtigung kommt später vom EventSubscriber
        }
      });
      
      console.log('[EditCategory] Löschergebnis:', result);
      
      // WICHTIG: Modal SOFORT schließen, ohne auf Backend-Antwort zu warten
      console.log('[EditCategory] Schließe Modal sofort nach Absenden der Löschanfrage');
      onClose();
      
    } catch (error) {
      console.error('[EditCategory] Fehler beim Löschen der Kategorie:', error);
      // Fehlerbehandlung erfolgt automatisch durch den Event-Manager
      
      // Bei Fehler ebenfalls sofort schließen
      onClose();
    }
  };

  // Verwende die EventManagedModal-Komponente anstelle der Standard-Modal-Komponente
  return (
    <EventManagedModal
      open={open}
      onClose={handleClose}
      modalId={MODAL_ID}
      title="Kategorie bearbeiten"
    >
      {/* Operationsstatus-Anzeige */}
      <OperationStatusIndicator 
        isPending={modalStatus.isPending}
        error={modalStatus.error}
        modalId={MODAL_ID}
      />
      
      {/* Ebene auswählen */}
      <Box sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
        <Typography variant="subtitle1" gutterBottom>
          Ebene auswählen
        </Typography>
        <ButtonGroup orientation="vertical" fullWidth aria-label="Ebene auswählen" sx={{ mt: 2 }}>
          <Button 
            variant={selectedLevel === 'Allianz' ? 'contained' : 'outlined'} 
            onClick={() => setSelectedLevel('Allianz')}
            disabled={modalStatus.isPending}
          >
            Allianz
          </Button>
          <Button 
            variant={selectedLevel === 'Organisation' ? 'contained' : 'outlined'} 
            onClick={() => setSelectedLevel('Organisation')}
            disabled={modalStatus.isPending}
          >
            Organisation
          </Button>
          <Button 
            variant={selectedLevel === 'Suborganisation' ? 'contained' : 'outlined'} 
            onClick={() => setSelectedLevel('Suborganisation')}
            disabled={modalStatus.isPending}
          >
            Suborganisation
          </Button>
        </ButtonGroup>
      </Box>
      
      {/* Kategorie konfigurieren */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Kategorie konfigurieren
        </Typography>
        <Box sx={{ mt: 2 }}>
          <PickerTextField 
            label="Kategoriename" 
            value={categoryName} 
            onChange={setCategoryName} 
            enableEmojiPicker 
            enableSpecialPicker 
            disabled={modalStatus.isPending}
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <DiscordRoleSelect 
            multiple 
            value={role} 
            onChange={(value) => setRole(value as string[])} 
            disabled={modalStatus.isPending}
          />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 1 }}>
          <FormControlLabel 
            control={<Switch checked={tracking} onChange={(e) => setTracking(e.target.checked)} disabled={modalStatus.isPending} />} 
            label="Tracking?" 
          />
          <FormControlLabel 
            control={<Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} disabled={modalStatus.isPending} />} 
            label="Sichtbar?" 
          />
          <FormControlLabel 
            control={<Switch checked={sendSetup} onChange={(e) => setSendSetup(e.target.checked)} disabled={modalStatus.isPending} />} 
            label="Setup Senden?" 
          />
        </Box>
      </Box>
      
      {/* Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
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
          <Button variant="contained" onClick={handleSave} disabled={!isValid()}>
            Speichern
          </Button>
        )}
      </Box>
    </EventManagedModal>
  );
};

export default EditCategoryModal;