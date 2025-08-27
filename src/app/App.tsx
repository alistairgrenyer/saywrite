/**
 * Main application component with feature-first architecture
 */
import React from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { AppProviders } from './providers/AppProviders';
import { AppShell } from './shell/AppShell';

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppShell />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
