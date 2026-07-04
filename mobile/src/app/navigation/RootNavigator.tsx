import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthStackParamList, AppStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants';

// Screens — Auth
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Screens — App
import HomeScreen from '../screens/HomeScreen';
import QueueScreen from '../screens/QueueScreen';
import AddClientScreen from '../screens/AddClientScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';

import LoadingSpinner from '../components/LoadingSpinner';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

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
  </AppStack.Navigator>
);

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullscreen message="Iniciando TurnoYa..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
