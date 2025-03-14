// src/components/common/OperationStatusIndicator.tsx

import React from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

interface OperationStatusIndicatorProps {
  isPending: boolean;
  error: string | null;
  modalId: string;
}

export function OperationStatusIndicator({ 
  isPending, 
  error, 
  modalId 
}: OperationStatusIndicatorProps) {
  // Zeige nur Fehler an, ignoriere den Ladestatus
  if (!error) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      <Alert severity="error">
        {error}
      </Alert>
    </Box>
  );
}