import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';
import { validatePassword, validateRequired } from '../utils/validators';
import Input from '../components/Input';
import Button from '../components/Button';
import NexturnaLogo from '../components/NexturnaLogo';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../constants';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login, isLoading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validate = (): boolean => {
    const idErr = validateRequired(identifier, 'El usuario o telefono');
    const pwErr = validatePassword(password);
    setIdentifierError(idErr);
    setPasswordError(pwErr);
    return !idErr && !pwErr;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) {
      return;
    }
    try {
      await login({ identifier: identifier.trim(), password });
    } catch {
      // Error handled by AuthContext
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <NexturnaLogo size={80} />
          <Text style={styles.brand}>Nexturna</Text>
          <Text style={styles.tagline}>Gestión de turnos para tu negocio</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Teléfono o correo electrónico"
            placeholder="Ej: +573001234567"
            value={identifier}
            onChangeText={(v) => { setIdentifier(v); setIdentifierError(null); }}
            autoCapitalize="none"
            keyboardType="email-address"
            error={identifierError}
            returnKeyType="next"
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(null); }}
            secureTextEntry
            secureToggle
            error={passwordError}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Button
            title={isLoading ? 'Ingresando...' : 'Ingresar'}
            onPress={handleLogin}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <Button
            title="Registrar mi negocio"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brand: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  tagline: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.danger,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  registerBtn: {
    marginTop: SPACING.md,
  },
});

export default LoginScreen;
