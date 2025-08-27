/**
 * Application providers for global state and context
 */
import React from 'react';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Future providers can be added here (theme, settings context, etc.)
  return <>{children}</>;
}
