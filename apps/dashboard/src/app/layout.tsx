// apps/dashboard/src/app/layout.tsx
import '@/config/config';
import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import '@/styles/global.css';
import { appConfig } from '@/config/app';
import { getSettings as getPersistedSettings } from '@/lib/settings';
import { Analytics } from '@/components/core/analytics';
import { EmotionCacheProvider } from '@/components/core/emotion-cache';
import { I18nProvider } from '@/components/core/i18n-provider';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { Rtl } from '@/components/core/rtl';
import { SettingsButton } from '@/components/core/settings/settings-button';
import { SettingsProvider } from '@/components/core/settings/settings-context';
import { ThemeProvider } from '@/components/core/theme-provider';
import { Toaster } from '@/components/core/toaster';
import ClientProviders from '@/hooks/client.providers';
import ClientSnackbarProvider from '@/components/ClientSnackbarProvider';


export const metadata = { title: appConfig.name } satisfies Metadata;
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: appConfig.themeColor,
} satisfies Viewport;

const AuthProvider: React.FC<React.PropsWithChildren> = React.Fragment;

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps): Promise<React.JSX.Element> {
  const settings = await getPersistedSettings();
  const direction = settings.direction ?? appConfig.direction;
  const language = settings.language ?? appConfig.language;

  return (
    <html dir={direction} lang={language} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Analytics>
            <LocalizationProvider>
              <SettingsProvider settings={settings}>
                <I18nProvider lng={language}>
                  <EmotionCacheProvider options={{ key: 'mui' }}>
                    <Rtl direction={direction}>
                      <ThemeProvider>
                        <ClientSnackbarProvider>
                          {/* Wichtig: ClientProviders liefert den ApolloProvider – hier drinnen sollte auch DashboardNotificationWrapper liegen */}
                          <ClientProviders>
                            {children}
                          </ClientProviders>
                          <SettingsButton />
                          <Toaster position="bottom-right" />
                        </ClientSnackbarProvider>
                      </ThemeProvider>
                    </Rtl>
                  </EmotionCacheProvider>
                </I18nProvider>
              </SettingsProvider>
            </LocalizationProvider>
          </Analytics>
        </AuthProvider>
      </body>
    </html>
  );
}
