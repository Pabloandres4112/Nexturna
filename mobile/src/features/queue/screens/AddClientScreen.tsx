import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueue } from '../hooks/useQueue';
import { useSettings } from '../hooks/useSettings';
import { validateName, validatePhoneNumber } from '../utils/validators';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants';

interface FormErrors {
  clientName: string | null;
  phoneNumber: string | null;
}

const AddClientScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addToQueue } = useQueue();
  const { settings } = useSettings();

  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [priority, setPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({
    clientName: null,
    phoneNumber: null,
  });

  const setFieldError = (field: keyof FormErrors, value: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const nameErr = validateName(clientName, 'El nombre del cliente');
    const phoneErr = validatePhoneNumber(phoneNumber);
    setErrors({ clientName: nameErr, phoneNumber: phoneErr });
    return !nameErr && !phoneErr;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await addToQueue({
        clientName: clientName.trim(),
        phoneNumber: phoneNumber.trim(),
        estimatedTimeMinutes: settings.averageServiceTime,
        priority,
      });

      Alert.alert('Cliente agregado', `${clientName.trim()} fue agregado a la cola.`, [
        { text: 'Agregar otro', onPress: resetForm },
        { text: 'Ver cola', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar el cliente.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setPhoneNumber('');
    setPriority(false);
    setErrors({ clientName: null, phoneNumber: null });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>Nuevo turno</Text>
          <Text style={styles.subtitle}>
            Tiempo estimado de atencion: {settings.averageServiceTime} min
          </Text>

          <View style={styles.form}>
            <Input
              label="Nombre del cliente"
              placeholder="Ej: Juan Perez"
              value={clientName}
              onChangeText={(v) => { setClientName(v); setFieldError('clientName', null); }}
              autoCapitalize="words"
              error={errors.clientName}
              returnKeyType="next"
            />

            <Input
              label="Numero de WhatsApp"
              placeholder="Ej: +573001234567"
              value={phoneNumber}
              onChangeText={(v) => { setPhoneNumber(v); setFieldError('phoneNumber', null); }}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Cliente prioritario</Text>
                <Text style={styles.switchHint}>
                  Se atenderá antes que otros en espera
                </Text>
              </View>
              <Switch
                value={priority}
                onValueChange={setPriority}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={priority ? COLORS.primary : COLORS.grayLight}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={loading ? 'Agregando...' : 'Agregar a la cola'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  pageTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  switchLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  switchHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    maxWidth: 200,
  },
  actions: {
    gap: SPACING.sm,
  },
  submitBtn: {},
  cancelBtn: {},
});

export default AddClientScreen;
