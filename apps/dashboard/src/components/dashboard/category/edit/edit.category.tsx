// apps/dashboard/src/components/dashboard/category/edit/edit.category.tsx
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
import { useUpdateCategory, useDeleteCategory, useCategoryEvents } from '@/hooks/categories';
import { useGuildContext } from '@/hooks/guild/use.guild.context';

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
  
  // Guild-ID aus dem Kontext holen
  const { guildId } = useGuildContext();
  
  console.log(`[EditCategory] Guild-ID aus Kontext: ${guildId || 'keine ID'}`);

  // Zustandsverwaltung via useResettableState
  const [selectedLevel, setSelectedLevel] = useResettableState(initialData?.selectedLevel || '', [initialData, open]);
  const [categoryName, setCategoryName] = useResettableState(initialData?.categoryName || '', [initialData, open]);
  const [role, setRole] = useResettableState<string[]>(initialData?.role || [], [initialData, open]);
  const [tracking, setTracking] = useResettableState(initialData?.tracking || false, [initialData, open]);
  const [visible, setVisible] = useResettableState(initialData?.visible || false, [initialData, open]);
  const [sendSetup, setSendSetup] = useResettableState(initialData?.sendSetup || false, [initialData, open]);

  // Neue Hooks verwenden
  const { updateCategory, isLoading: isUpdating, error: updateError } = useUpdateCategory();
  const { deleteCategory, isLoading: isDeleting, error: deleteError } = useDeleteCategory();
  const { fetchCategories } = useCategoryEvents();

  // Kombinierter Beladungsstatus
  const isLoading = isUpdating || isDeleting;
  const error = updateError || deleteError;

  // Formularvalidierung
  const isValid = () =>
    selectedLevel.trim() !== '' && categoryName.trim() !== '' && role.length > 0;

  // Handler für Schließen des Modals
  const handleClose = () => {
    console.log('[EditCategory] Modal wird geschlossen');
    onClose();
  };

  // Update-Kategorie-Funktion mit vereinfachtem Ablauf
  const handleSave = async () => {
    if (!initialData?.id) {
      console.error('[EditCategory] Keine initialData.id verfügbar, kann Update nicht ausführen');
      return;
    }

    try {
      console.log('[EditCategory] Speichere Kategorie-Änderungen für ID:', initialData.id);
      
      // Update-Daten zusammenstellen
      const updateData = {
        name: categoryName,
        category_type: selectedLevel,
        is_visible: visible,
        is_tracking_active: tracking,
        is_send_setup: sendSetup,
        allowed_roles: role,
      };

      // WICHTIG: Schließe Modal SOFORT, bevor die Operation gestartet wird
      console.log('[EditCategory] Schließe Modal sofort');
      onClose();

      // Führe die Update-Operation aus (im Hintergrund)
      updateCategory(initialData.id, updateData)
        .then((data: any) => {
          console.log('[EditCategory] Kategorie erfolgreich aktualisiert:', data);
          
          // Rufe onSave Callback auf, falls vorhanden
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
          
          // Aktualisiere die Kategorien explizit
          fetchCategories();
        })
        .catch((error: Error) => {
          console.error('[EditCategory] Fehler beim Aktualisieren der Kategorie:', error);
        });
      
    } catch (error) {
      console.error('[EditCategory] Fehler beim Aktualisieren der Kategorie:', error);
      onClose();
    }
  };

  // Vereinfachte Lösch-Funktion
  const handleDelete = () => {
    if (!initialData?.id) {
      console.error('[EditCategory] Keine initialData.id verfügbar, kann Löschung nicht ausführen');
      return;
    }

    // WICHTIG: Schließe Modal SOFORT, bevor die Operation gestartet wird
    console.log('[EditCategory] Schließe Modal sofort vor Löschung');
    onClose();

    // Führe die Lösch-Operation im Hintergrund aus
    deleteCategory(initialData.id)
      .then((data: any) => {
        console.log('[EditCategory] Kategorie erfolgreich gelöscht:', data);
        
        // Rufe onDelete Callback auf, falls vorhanden
        if (onDelete) {
          onDelete();
        }
        
        // Aktualisiere die Kategorien explizit
        fetchCategories();
      })
      .catch((error: Error) => {
        console.error('[EditCategory] Fehler beim Löschen der Kategorie:', error);
      });
    
    // WICHTIG: Rufe onDelete Callback auf, unabhängig vom Ergebnis der Löschoperation
    if (onDelete) {
      console.log('[EditCategory] Rufe onDelete Callback direkt auf');
      onDelete();
    }
  };

  // Verwende die EventManagedModal-Komponente
  return (
    <EventManagedModal
      open={open}
      onClose={handleClose}
      modalId={MODAL_ID}
      title="Kategorie bearbeiten"
    >
      {/* Operationsstatus-Anzeige */}
      <OperationStatusIndicator 
        isPending={isLoading}
        error={error ? error.message : null}
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
            disabled={isLoading}
          >
            Allianz
          </Button>
          <Button 
            variant={selectedLevel === 'Organisation' ? 'contained' : 'outlined'} 
            onClick={() => setSelectedLevel('Organisation')}
            disabled={isLoading}
          >
            Organisation
          </Button>
          <Button 
            variant={selectedLevel === 'Suborganisation' ? 'contained' : 'outlined'} 
            onClick={() => setSelectedLevel('Suborganisation')}
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <DiscordRoleSelect 
            multiple 
            value={role} 
            onChange={(value) => setRole(value as string[])} 
            disabled={isLoading}
          />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 1 }}>
          <FormControlLabel 
            control={<Switch checked={tracking} onChange={(e) => setTracking(e.target.checked)} disabled={isLoading} />} 
            label="Tracking?" 
          />
          <FormControlLabel 
            control={<Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} disabled={isLoading} />} 
            label="Sichtbar?" 
          />
          <FormControlLabel 
            control={<Switch checked={sendSetup} onChange={(e) => setSendSetup(e.target.checked)} disabled={isLoading} />} 
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
          disabled={isLoading}
        >
          Löschen
        </Button>
        
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={!isValid() || isLoading}
        >
          Speichern
        </Button>
      </Box>
    </EventManagedModal>
  );
};

export default EditCategoryModal;