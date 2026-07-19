import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Card } from '@ui-kit';
import { COLORS, SPACING, TYPOGRAPHY } from '@shared/constants';
import { validatePhoneNumber, validateRequired } from '@shared/utils/validators';
import { useWhatsAppTest } from '../hooks/useWhatsAppTest';

interface FormErrors {
  phoneNumber: string | null;
  message: string | null;
}

const WhatsAppTestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { loading, result, error, sendTestMessage } = useWhatsAppTest();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Mensaje de prueba desde Nexturna 🚀');
  const [errors, setErrors] = useState<FormErrors>({ phoneNumber: null, message: null });

  const setFieldError = (field: keyof FormErrors, value: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const phoneErr = validatePhoneNumber(phoneNumber);
    const messageErr = validateRequired(message, 'El mensaje');
    setErrors({ phoneNumber: phoneErr, message: messageErr });
    return !phoneErr && !messageErr;
  };

  const handleSend = async () => {
    if (!validate()) {
      return;
    }
    try {
      await sendTestMessage(phoneNumber.trim(), message.trim());
    } catch {
      // El error ya queda expuesto via el estado `error` del hook.
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Probar envío de WhatsApp</Text>
          <Text style={styles.subtitle}>
            Manda un mensaje real usando las credenciales configuradas en el backend. El número
            destino tiene que estar agregado como destinatario de prueba en Meta si todavía no es
            un número de producción verificado.
          </Text>

          <Card style={styles.card}>
            <Input
              label="Número de WhatsApp destino"
              placeholder="Ej: +573001234567"
              value={phoneNumber}
              onChangeText={(v) => {
                setPhoneNumber(v);
                setFieldError('phoneNumber', null);
              }}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              returnKeyType="next"
            />

            <Input
              label="Mensaje"
              placeholder="Texto del mensaje"
              value={message}
              onChangeText={(v) => {
                setMessage(v);
                setFieldError('message', null);
              }}
              multiline
              numberOfLines={3}
              error={errors.message}
              returnKeyType="done"
            />

            <Button
              title={loading ? 'Enviando...' : 'Enviar mensaje de prueba'}
              onPress={handleSend}
              loading={loading}
              style={styles.sendBtn}
            />
          </Card>

          {result?.success ? (
            <Card style={StyleSheet.flatten([styles.resultCard, styles.resultSuccess])}>
              <Text style={styles.resultTitle}>✅ Mensaje enviado</Text>
              {result.messageId ? (
                <Text style={styles.resultDetail}>ID: {result.messageId}</Text>
              ) : null}
            </Card>
          ) : null}

          {result && !result.success ? (
            <Card style={StyleSheet.flatten([styles.resultCard, styles.resultError])}>
              <Text style={styles.resultTitle}>⚠️ No se pudo enviar</Text>
              <Text style={styles.resultDetail}>{result.error ?? 'Error desconocido'}</Text>
            </Card>
          ) : null}

          {error ? (
            <Card style={StyleSheet.flatten([styles.resultCard, styles.resultError])}>
              <Text style={styles.resultTitle}>⚠️ Error</Text>
              <Text style={styles.resultDetail}>{error}</Text>
            </Card>
          ) : null}

          <Button
            title="Volver"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
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
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  sendBtn: {
    marginTop: SPACING.sm,
  },
  resultCard: {
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  resultError: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
  },
  resultTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  resultDetail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  backBtn: {
    marginTop: SPACING.md,
  },
});

export default WhatsAppTestScreen;
