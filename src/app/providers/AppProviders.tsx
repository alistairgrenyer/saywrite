/**
 * Application providers for global state and context
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { mantineTheme } from '@shared/lib/mantine-theme';
import '@mantine/core/styles.css';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MantineProvider theme={mantineTheme}>
      {children}
    </MantineProvider>
  );
}
