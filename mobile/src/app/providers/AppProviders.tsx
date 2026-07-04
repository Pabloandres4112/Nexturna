import React from 'react';
import { AuthProvider } from '@features/auth';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Punto unico de composicion de providers globales de la app.
 * Hoy solo envuelve AuthProvider; providers futuros (p. ej. QueryClientProvider) se agregan aqui.
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

export default AppProviders;
