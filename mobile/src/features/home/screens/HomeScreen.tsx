import React from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useQueue } from '../hooks/useQueue';
import { useSettings } from '../hooks/useSettings';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import NexturnaLogo from '../components/NexturnaLogo';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../constants';

type HomeNavProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

interface MetricCardProps {
  label: string;
  value: string | number;
  tint: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, tint }) => (
  <View style={[styles.metricCard, { borderTopColor: tint }]}>
    <Text style={[styles.metricValue, { color: tint }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const { user, logout } = useAuth();
  const { waitingCount, completedCount, noShowCount, loading: queueLoading, refresh } = useQueue();
  const { settings } = useSettings();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (queueLoading) {
    return <LoadingSpinner fullscreen message="Cargando dashboard..." />;
  }

  const totalAttended = completedCount + noShowCount;
  const avgWait = settings.averageServiceTime ?? 30;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={queueLoading} onRefresh={refresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <NexturnaLogo size={36} mono />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.businessName} numberOfLines={1}>
              {user?.businessName ?? 'Tu negocio'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            settings.automationEnabled
              ? styles.statusActive
              : styles.statusPaused,
          ]}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: settings.automationEnabled
                  ? COLORS.secondary
                  : COLORS.warning,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {settings.automationEnabled
              ? 'WhatsApp activo — mensajes automaticos habilitados'
              : 'WhatsApp pausado — mensajes desactivados'}
          </Text>
        </View>

        {/* Metrics */}
        <Text style={styles.sectionTitle}>Resumen del dia</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="En espera"
            value={waitingCount}
            tint={COLORS.warning}
          />
          <MetricCard
            label="Atendidos"
            value={completedCount}
            tint={COLORS.secondary}
          />
          <MetricCard
            label="No asistieron"
            value={noShowCount}
            tint={COLORS.danger}
          />
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total del dia</Text>
            <Text style={styles.infoValue}>{totalAttended + waitingCount}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Tiempo promedio</Text>
            <Text style={styles.infoValue}>{avgWait} min</Text>
          </View>
        </Card>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Acciones rapidas</Text>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => navigation.navigate('Queue')}
          activeOpacity={0.85}>
          <View style={styles.actionContent}>
            <View style={styles.actionIconPrimary}>
              <View style={styles.actionIconInner} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Ver cola de turnos</Text>
              <Text style={styles.actionSubtitle}>
                {waitingCount} personas en espera
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSecondary]}
          onPress={() => navigation.navigate('AddClient')}
          activeOpacity={0.85}>
          <View style={styles.actionContent}>
            <View style={styles.actionIconSecondary}>
              <View style={styles.actionIconPlus} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Agregar cliente</Text>
              <Text style={styles.actionSubtitle}>
                Registrar nuevo turno
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionNeutral]}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.85}>
          <View style={styles.actionContent}>
            <View style={styles.actionIconNeutral}>
              <View style={styles.actionIconGear} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Configuración</Text>
              <Text style={styles.actionSubtitle}>
                Ajustes de tu negocio
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerText: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  greeting: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
  businessName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    maxWidth: 220,
  },
  logoutBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
  },
  logoutText: {
    ...TYPOGRAPHY.label,
    color: COLORS.danger,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statusActive: {
    backgroundColor: COLORS.secondaryLight,
  },
  statusPaused: {
    backgroundColor: COLORS.warningLight,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderTopWidth: 3,
    alignItems: 'center',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricValue: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  actionBtn: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionSecondary: {
    backgroundColor: COLORS.secondary,
  },
  actionNeutral: {
    backgroundColor: COLORS.gray,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionIconPrimary: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: '#1d4ed8',
  },
  actionIconSecondary: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: '#059669',
  },
  actionIconNeutral: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.gray,
  },
  actionIconInner: {
    width: 20,
    height: 16,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  actionIconPlus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  actionIconGear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  actionTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default HomeScreen;
