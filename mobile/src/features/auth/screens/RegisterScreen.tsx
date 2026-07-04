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
import {
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhoneNumber,
} from '../utils/validators';
import Input from '../components/Input';
import Button from '../components/Button';
import NexturnaLogo from '../components/NexturnaLogo';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../constants';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface FormErrors {
  businessName: string | null;
  whatsappNumber: string | null;
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
}

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const { register, isLoading, error, clearError } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({
    businessName: null,
    whatsappNumber: null,
    email: null,
    password: null,
    confirmPassword: null,
  });

  const setFieldError = (field: keyof FormErrors, value: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const nameErr = validateName(businessName, 'El nombre del negocio');
    const phoneErr = validatePhoneNumber(whatsappNumber);
    const pwErr = validatePassword(password);
    const confirmErr = validatePasswordConfirm(password, confirmPassword);

    setErrors({
      businessName: nameErr,
      whatsappNumber: phoneErr,
      email: null,
      password: pwErr,
      confirmPassword: confirmErr,
    });

    return !nameErr && !phoneErr && !pwErr && !confirmErr;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) {
      return;
    }
    try {
      await register({
        businessName: businessName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim() || undefined,
        password,
      });
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
        <View style={styles.headerRow}>
          <Button
            title="Volver"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
        </View>

        <View style={styles.header}>
          <NexturnaLogo size={56} showWordmark />
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Registra tu negocio y comienza a gestionar tus turnos
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Nombre del negocio"
            placeholder="Ej: Barberia El Sol"
            value={businessName}
            onChangeText={(v) => { setBusinessName(v); setFieldError('businessName', null); }}
            autoCapitalize="words"
            error={errors.businessName}
            returnKeyType="next"
          />

          <Input
            label="Numero de WhatsApp"
            placeholder="Ej: +573001234567"
            value={whatsappNumber}
            onChangeText={(v) => { setWhatsappNumber(v); setFieldError('whatsappNumber', null); }}
            keyboardType="phone-pad"
            error={errors.whatsappNumber}
            returnKeyType="next"
          />

          <Input
            label="Correo electrónico (opcional)"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldError('email', null); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            returnKeyType="next"
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={(v) => { setPassword(v); setFieldError('password', null); }}
            secureTextEntry
            secureToggle
            error={errors.password}
            returnKeyType="next"
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setFieldError('confirmPassword', null); }}
            secureTextEntry
            secureToggle
            error={errors.confirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <Button
            title={isLoading ? 'Registrando...' : 'Crear cuenta'}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ya tienes cuenta?</Text>
          <Button
            title="Ingresar"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.navigate('Login')}
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
    padding: SPACING.lg,
  },
  headerRow: {
    marginBottom: SPACING.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
});

export default RegisterScreen;
