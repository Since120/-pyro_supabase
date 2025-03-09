// src/hooks/client.providers.tsx
/**
 * Client-Provider-Komponente
 * 
 * Diese Komponente initialisiert alle notwendigen Provider für die Client-Anwendung:
 * - Apollo-Client für GraphQL (temporär deaktiviert für Supabase-Migration)
 * - Guild-Provider für Discord-Server-Kontext
 * - Event-Manager für zentrales Event-Handling
 * - Snackbar-Provider für Benachrichtigungen
 * - Dashboard-Notification-Wrapper für einheitliche Benachrichtigungen
 */

'use client';

import React from 'react';
// ApolloProvider temporär deaktiviert während der Migration zu Supabase
// import { ApolloProvider } from '@apollo/client';
// import client from '@/lib/apollo.client';
import { SnackbarProvider } from 'notistack';
import { EventManagerProvider } from '@/services/EventManager';
import DashboardNotificationWrapper from '@/components/DashboardNotificationWrapper';
import { GuildProvider } from '@/hooks/guild/use.guild.context';
import { GuildIdSetter } from '@/components/core/guild.id.setter';

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Initialisiert alle Client-Provider in der korrekten Reihenfolge
 * Apollo-Provider wurde während der Migration zu Supabase temporär entfernt
 */
const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    // <ApolloProvider client={client}> -- Temporär deaktiviert für Supabase-Migration
      <SnackbarProvider 
        maxSnack={5} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={5000}
        preventDuplicate={false} // WICHTIG: Wir verwalten Duplikate selbst
      >
        {/* Guild-Provider für Discord-Server-Kontext */}
        <GuildProvider>
          {/* Event-Manager initialisiert alle Subscriptions und Hooks */}
          <EventManagerProvider>
            {/* Dashboard-Notification-Wrapper bietet API für Benachrichtigungen */}
            <DashboardNotificationWrapper>
              {children}
              {/* Server-ID Konfigurator für schnellen Zugriff */}
              <GuildIdSetter />
            </DashboardNotificationWrapper>
          </EventManagerProvider>
        </GuildProvider>
      </SnackbarProvider>
    // </ApolloProvider> -- Temporär deaktiviert für Supabase-Migration
  );
};

export default ClientProviders;