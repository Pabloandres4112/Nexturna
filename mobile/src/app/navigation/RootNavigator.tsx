import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth, AuthNavigator } from '@features/auth';
import { HomeScreen } from '@features/home';
import { QueueScreen, AddClientScreen, ClientDetailScreen } from '@features/queue';
import { SettingsScreen } from '@features/settings';
import { WhatsAppTestScreen } from '@features/whatsapp';
import { LoadingSpinner } from '@ui-kit';
import { COLORS } from '@shared/constants';

import type { AppStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => (
  <AppStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.white,
      },
      headerTintColor: COLORS.primary,
      headerTitleStyle: {
        fontWeight: '700',
        color: COLORS.textPrimary,
      },
      headerShadowVisible: true,
    }}>
    <AppStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="Queue"
      component={QueueScreen}
      options={{ title: 'Cola de Turnos' }}
    />
    <AppStack.Screen
      name="AddClient"
      component={AddClientScreen}
      options={{ title: 'Nuevo Turno' }}
    />
    <AppStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: 'Configuracion' }}
    />
    <AppStack.Screen
      name="ClientDetail"
      component={ClientDetailScreen}
      options={{ title: 'Detalle del Turno' }}
    />
    <AppStack.Screen
      name="WhatsAppTest"
      component={WhatsAppTestScreen}
      options={{ title: 'Probar WhatsApp' }}
    />
  </AppStack.Navigator>
);

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullscreen message="Iniciando Nexturna..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
