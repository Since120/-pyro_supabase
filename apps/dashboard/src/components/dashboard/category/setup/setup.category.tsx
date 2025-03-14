// Optimiertes setup.category.tsx mit sofortigem Modal-Schließen und Supabase-Integration
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  ButtonGroup,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import { EventManagedModal } from '../../../common/EventManagedModal';
import { OperationStatusIndicator } from '../../../common/OperationStatusIndicator';
import PickerTextField from '../../../core/picker.text.field';
import DiscordRoleSelect from '../../../core/discord.role.select';
import { useSupabaseCategories } from '../../../../hooks/categories/use.supabase.categories';
import { useGuildContext } from '../../../../hooks/guild/use.guild.context';
import { useSnackbar } from 'notistack';
import { EntityType, OperationType, CategoryEventType } from '../../../../services/EventManager/typeDefinitions';
import { useEventManager } from '../../../../services/EventManager';

// Eindeutige Modal-ID für den Event-Manager
const MODAL_ID = 'setup-category-modal';

interface SetupCategoryProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal zur Erstellung einer neuen Kategorie mit Supabase-Integration
 */
const SetupCategory: React.FC<SetupCategoryProps> = ({ open, onClose }) => {
  // Step state
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guild Kontext verwenden
  const { guildId } = useGuildContext();
  const { enqueueSnackbar } = useSnackbar();
  const { startOperation, completeOperation } = useEventManager();
  
  // Effekt zum Zurücksetzen des Schritts, wenn das Modal geöffnet wird
  useEffect(() => {
    if (open) {
      console.log('[SetupCategory] Modal geöffnet - setze auf Schritt 1');
      setActiveStep(0);
    }
  }, [open]);

  // Form state
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [role, setRole] = useState<string[]>([]);
  const [tracking, setTracking] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [sendSetup, setSendSetup] = useState<boolean>(false);
  

  // Supabase Hooks für Kategorien
  const { createCategory, fetchCategories } = useSupabaseCategories(guildId);

  // Formularvalidierung
  const isStepValid = () => {
    if (activeStep === 0) return selectedLevel.trim() !== '';
    if (activeStep === 1) return categoryName.trim() !== '' && role.length > 0;
    return true;
  };

  // Erstellung einer Kategorie mit Supabase und Event-Manager-Integration
  const handleCreateCategory = () => {
    if (!guildId) {
      enqueueSnackbar('Keine Guild ID gefunden. Bitte wähle eine Guild aus.', { variant: 'error' });
      return;
    }
    
    // WICHTIG: Das Formular zurücksetzen, bevor das Modal geschlossen wird
    // Dadurch wird sichergestellt, dass es beim nächsten Öffnen auf Schritt 1 steht
    console.log('[SetupCategory] Setze Formular zurück vor dem Schließen');
    handleReset();
    
    // WICHTIG: Sofort das Modal schließen, ohne auf das Ergebnis zu warten
    console.log('[SetupCategory] Schließe Modal sofort');
    onClose();
      
    // Kategorie-Daten für Supabase vorbereiten
    const categoryData = {
      name: categoryName,
      category_type: selectedLevel,
      guild_id: guildId,
      allowed_roles: role,
      settings: {
        is_visible: visible,
        is_tracking_active: tracking,
        is_send_setup: sendSetup,
        is_deleted_in_discord: false
      }
    };
    
    // Starte die Operation im Hintergrund, ohne zu warten
    createCategory(categoryData)
      .then(newCategory => {
        console.log('[SetupCategory] Kategorie erfolgreich erstellt:', newCategory);
        
        // WICHTIG: Explizit die Kategorien neu laden, um sicherzustellen, dass die Tabelle aktualisiert wird
        // Auch wenn die Realtime-Events gehen sollten, ist dies ein Fallback
        console.log('[SetupCategory] Expliziter Reload der Kategorien nach Erstellung');
        fetchCategories();
        
        // Nach einer kurzen Verzögerung noch einmal aktualisieren, falls die erste Anfrage zu schnell war
        setTimeout(() => {
          console.log('[SetupCategory] Verzögerter Reload der Kategorien nach Erstellung');
          fetchCategories();
        }, 500);
      })
      .catch(error => {
        console.error('Fehler beim Erstellen der Kategorie:', error);
        enqueueSnackbar(`Fehler beim Erstellen der Kategorie: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, { 
          variant: 'error' 
        });
      });
  };

  // Formular zurücksetzen
  const handleReset = () => {
    setActiveStep(0);
    setSelectedLevel('');
    setCategoryName('');
    setRole([]);
    setTracking(false);
    setVisible(true);
    setSendSetup(false);
  };

  // Bei Schließen des Modals Formular zurücksetzen
  const handleClose = () => {
    console.log('[SetupCategory] Modal wird geschlossen, setze Formular zurück');
    handleReset();
    // onClose wird aufgerufen, was auch die Tabelle aktualisiert
    onClose();
  };

  // Navigation zwischen Schritten
  const handleNext = () => {
    if (!isStepValid()) return;
    
    if (activeStep === 2) {
      // Auf dem letzten Schritt, Kategorie erstellen
      handleCreateCategory();
      return;
    }
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Render-Funktionen für die verschiedenen Schritte
  const renderStep1 = () => (
    <Box sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
      <Typography variant="h6" gutterBottom>
        Level auswählen
      </Typography>
      <ButtonGroup orientation="vertical" fullWidth aria-label="Select level" sx={{ mt: 2 }}>
        <Button
          variant={selectedLevel === 'Allianz' ? 'contained' : 'outlined'}
          onClick={() => setSelectedLevel('Allianz')}
          disabled={isSubmitting}
        >
          Allianz
        </Button>
        <Button
          variant={selectedLevel === 'Organisation' ? 'contained' : 'outlined'}
          onClick={() => setSelectedLevel('Organisation')}
          disabled={isSubmitting}
        >
          Organisation
        </Button>
        <Button
          variant={selectedLevel === 'Suborganisation' ? 'contained' : 'outlined'}
          onClick={() => setSelectedLevel('Suborganisation')}
          disabled={isSubmitting}
        >
          Suborganisation
        </Button>
      </ButtonGroup>
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Kategorie konfigurieren
      </Typography>
      <Box sx={{ mt: 2 }}>
        <PickerTextField
          label="Kategoriename"
          value={categoryName}
          onChange={setCategoryName}
          enableEmojiPicker={true}
          enableSpecialPicker={true}
          disabled={isSubmitting}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <DiscordRoleSelect 
          multiple={true} 
          value={role} 
          onChange={(value) => setRole(value as string[])} 
          disabled={isSubmitting}
        />
      </Box>
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <FormControlLabel
          control={
            <Switch 
              checked={tracking} 
              onChange={(e) => setTracking(e.target.checked)} 
              disabled={isSubmitting}
            />
          }
          label="Tracking aktivieren?"
        />
        <FormControlLabel
          control={
            <Switch 
              checked={visible} 
              onChange={(e) => setVisible(e.target.checked)} 
              disabled={isSubmitting}
            />
          }
          label="Sichtbar?"
        />
        <FormControlLabel
          control={
            <Switch 
              checked={sendSetup} 
              onChange={(e) => setSendSetup(e.target.checked)} 
              disabled={isSubmitting}
            />
          }
          label="Setup senden?"
        />
      </Box>
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        Zusammenfassung
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle1"><strong>Level:</strong></Typography>
        <Typography variant="body1">{selectedLevel || 'Nicht ausgewählt'}</Typography>
        
        <Typography variant="subtitle1"><strong>Kategoriename:</strong></Typography>
        <Typography variant="body1">{categoryName || 'Nicht eingegeben'}</Typography>
        
        <Typography variant="subtitle1"><strong>Rollen:</strong></Typography>
        <Typography variant="body1">
          {role.length > 0 ? role.join(', ') : 'Nicht ausgewählt'}
        </Typography>
        
        <Typography variant="subtitle1"><strong>Tracking:</strong></Typography>
        <Typography variant="body1">{tracking ? 'Ja' : 'Nein'}</Typography>
        
        <Typography variant="subtitle1"><strong>Sichtbar:</strong></Typography>
        <Typography variant="body1">{visible ? 'Ja' : 'Nein'}</Typography>
        
        <Typography variant="subtitle1"><strong>Setup senden:</strong></Typography>
        <Typography variant="body1">{sendSetup ? 'Ja' : 'Nein'}</Typography>
      </Box>
    </Box>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      default: return 'Unbekannter Schritt';
    }
  };

  return (
    <EventManagedModal
      open={open}
      onClose={handleClose}
      modalId={MODAL_ID}
      title="Neue Kategorie erstellen"
      disableAutoClose={false}
    >
      {/* Status-Anzeige */}
      <OperationStatusIndicator 
        isPending={isSubmitting}
        error={null}
        modalId={MODAL_ID}
      />
      
      {/* Schritt-Inhalt */}
      {renderStepContent(activeStep)}
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || isSubmitting}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Zurück
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        
        {isSubmitting ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">
              Erstelle Kategorie...
            </Typography>
          </Box>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            variant={activeStep === 2 ? "contained" : "outlined"}
            color={activeStep === 2 ? "primary" : "inherit"}
          >
            {activeStep === 2 ? 'Erstellen' : 'Weiter'}
          </Button>
        )}
      </Box>
    </EventManagedModal>
  );
};

export default SetupCategory;