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
  if (!isPending && !error) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : isPending ? (
        <Alert 
          severity="info"
          icon={<CircularProgress size={20} />}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">
              Wird verarbeitet...
            </Typography>
          </Box>
        </Alert>
      ) : null}
    </Box>
  );
}