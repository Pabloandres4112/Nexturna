/**
 * Nexturna - Sistema de Gestión de Turnos
 * Frontend React Native con TypeScript
 */

import React from 'react';
import 'react-native-gesture-handler';
import AppProviders from './src/app/providers/AppProviders';
import RootNavigator from './src/app/navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
};

export default App;
