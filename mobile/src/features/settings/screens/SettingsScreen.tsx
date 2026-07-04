import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { validatePositiveNumber } from '../utils/validators';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, loading, saving, updateSettings } = useSettings();

  const [avgTime, setAvgTime] = useState(String(settings.averageServiceTime));
  const [maxDays, setMaxDays] = useState(String(settings.maxDaysAhead));
  const [automation, setAutomation] = useState(settings.automationEnabled);
  const [avgTimeError, setAvgTimeError] = useState<string | null>(null);
  const [maxDaysError, setMaxDaysError] = useState<string | null>(null);

  // Sync local state when settings load
  useEffect(() => {
    setAvgTime(String(settings.averageServiceTime));
    setMaxDays(String(settings.maxDaysAhead));
    setAutomation(settings.automationEnabled);
  }, [settings]);

  const validate = (): boolean => {
    const avgErr = validatePositiveNumber(avgTime, 'El tiempo promedio');
    const daysErr = validatePositiveNumber(maxDays, 'Los dias de anticipacion');
    setAvgTimeError(avgErr);
    setMaxDaysError(daysErr);
    return !avgErr && !daysErr;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }
    try {
      await updateSettings({
        settings: {
          averageServiceTime: parseInt(avgTime, 10),
          automationEnabled: automation,
          maxDaysAhead: parseInt(maxDays, 10),
          excludedContacts: settings.excludedContacts,
        },
      });
      Alert.alert('Listo', 'Configuracion guardada correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuracion.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Cargando configuracion..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Business Info */}
          <Text style={styles.sectionLabel}>Información del negocio</Text>
          <Card style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Negocio</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.businessName ?? '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>WhatsApp</Text>
              <Text style={styles.infoValue}>{user?.whatsappNumber ?? '-'}</Text>
            </View>
            {user?.email ? (
              <View style={[styles.infoRow, styles.noBorder]}>
                <Text style={styles.infoKey}>Correo</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            ) : (
              <View style={[styles.infoRow, styles.noBorder]}>
                <Text style={styles.infoKey}>Rol</Text>
                <Text style={styles.infoValue}>{user?.role ?? '-'}</Text>
              </View>
            )}
          </Card>

          {/* Queue Settings */}
          <Text style={styles.sectionLabel}>Configuración de cola</Text>
          <Card style={styles.card}>
            <Input
              label="Tiempo promedio de atención (minutos)"
              placeholder="30"
              value={avgTime}
              onChangeText={(v) => { setAvgTime(v); setAvgTimeError(null); }}
              keyboardType="numeric"
              error={avgTimeError}
            />
            <Input
              label="Días de anticipación permitidos"
              placeholder="7"
              value={maxDays}
              onChangeText={(v) => { setMaxDays(v); setMaxDaysError(null); }}
              keyboardType="numeric"
              error={maxDaysError}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrapper}>
                <Text style={styles.switchLabel}>
                  Mensajes automaticos WhatsApp
                </Text>
                <Text style={styles.switchHint}>
                  {automation
                    ? 'Se envian notificaciones automaticas'
                    : 'Las notificaciones automaticas estan desactivadas'}
                </Text>
              </View>
              <Switch
                value={automation}
                onValueChange={setAutomation}
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primaryLight,
                }}
                thumbColor={automation ? COLORS.primary : COLORS.grayLight}
              />
            </View>
          </Card>

          {/* Save */}
          <Button
            title={saving ? 'Guardando...' : 'Guardar cambios'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />

          {/* Logout */}
          <Button
            title="Cerrar sesión"
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.version}>TurnoYa v1.0.0</Text>
            <Text style={styles.copyright}>2026 TurnoYa</Text>
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
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoKey: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
  infoValue: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 200,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  switchTextWrapper: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  switchHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  saveBtn: {
    marginTop: SPACING.md,
  },
  logoutBtn: {
    marginTop: SPACING.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  version: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  copyright: {
    ...TYPOGRAPHY.caption,
    color: COLORS.grayLighter,
  },
});

export default SettingsScreen;
