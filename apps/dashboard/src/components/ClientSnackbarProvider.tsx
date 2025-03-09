'use client';
import React from 'react';
import { SnackbarProvider } from 'notistack';

// Verbesserte Snackbar-Konfiguration ohne DashboardNotificationWrapper
const ClientSnackbarProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <SnackbarProvider 
      maxSnack={5} 
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={5000}
      preventDuplicate={false} // WICHTIG: Wir verwalten Duplikate selbst in den Event-Hooks
    >
      {children}
    </SnackbarProvider>
  );
};

export default ClientSnackbarProvider;