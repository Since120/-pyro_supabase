import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import { useGuildContext } from '@/hooks/guild/use.guild.context';
import { supabase } from 'pyro-types';

/**
 * Komponente zum Setzen der Guild-ID im Dashboard
 * Diese Komponente zeigt einen Button an, der ein Modal öffnet, um die Guild-ID zu konfigurieren
 */
export const GuildIdSetter: React.FC = () => {
  const { guildId, setGuildId } = useGuildContext();
  const [open, setOpen] = useState(false);
  const [newGuildId, setNewGuildId] = useState(guildId || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setNewGuildId(guildId || '');
    setValidationResult(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Validiere die Guild-ID gegen Supabase
  const validateGuildId = async (id: string) => {
    if (!id) {
      setValidationResult({
        valid: false,
        message: 'Guild-ID darf nicht leer sein'
      });
      return false;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Überprüfe, ob die Guild-ID in der discord_sync-Tabelle existiert
      const { data, error } = await supabase
        .from('discord_sync')
        .select('id')
        .eq('guild_id', id)
        .limit(1);

      if (error) {
        setValidationResult({
          valid: false,
          message: `Fehler bei der Validierung: ${error.message}`
        });
        return false;
      }

      if (!data || data.length === 0) {
        setValidationResult({
          valid: false,
          message: 'Keine Daten für diese Guild-ID in Supabase gefunden. Stelle sicher, dass der Bot mit diesem Server verbunden ist.'
        });
        return false;
      }

      setValidationResult({
        valid: true,
        message: 'Guild-ID ist gültig!'
      });
      return true;
    } catch (err) {
      console.error('Fehler bei der Validierung der Guild-ID:', err);
      setValidationResult({
        valid: false,
        message: 'Ein unerwarteter Fehler ist aufgetreten'
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    const isValid = await validateGuildId(newGuildId);
    if (isValid) {
      setGuildId(newGuildId);
      handleClose();
      // Seite neu laden, um sicherzustellen, dass alle Komponenten die neue Guild-ID verwenden
      window.location.reload();
    }
  };

  return (
    <>
      <Tooltip title="Server-ID konfigurieren">
        <IconButton 
          onClick={handleOpen}
          color="primary"
          size="small"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 999,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'primary.light',
            }
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Server-ID Konfiguration
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" paragraph>
              Gib die Discord-Server-ID ein, die mit dem Bot verbunden ist. 
              Diese ID wird benötigt, um Rollen und andere Daten abzurufen.
            </Typography>
            
            <TextField
              fullWidth
              label="Discord-Server-ID"
              value={newGuildId}
              onChange={(e) => setNewGuildId(e.target.value)}
              variant="outlined"
              disabled={isValidating}
              error={validationResult?.valid === false}
              helperText={validationResult?.message || 'Die ID findest du in Discord unter Servereinstellungen > Widget'}
              sx={{ mb: 2 }}
            />

            {validationResult && (
              <Box 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  borderRadius: 1,
                  bgcolor: validationResult.valid ? 'success.light' : 'error.light',
                  color: validationResult.valid ? 'success.contrastText' : 'error.contrastText'
                }}
              >
                <Typography variant="body2">
                  {validationResult.message}
                </Typography>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary">
              Aktuelle Server-ID: {guildId || 'Nicht gesetzt'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Abbrechen
          </Button>
          <Button 
            onClick={() => validateGuildId(newGuildId)} 
            color="primary" 
            disabled={isValidating || !newGuildId}
          >
            {isValidating ? <CircularProgress size={24} /> : 'Validieren'}
          </Button>
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            disabled={isValidating || validationResult?.valid !== true}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};