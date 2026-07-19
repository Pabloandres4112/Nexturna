import React from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { QueueItem } from '../types';
import { useQueueHistory } from '../hooks/useQueueHistory';
import { Badge, EmptyState, ErrorMessage, LoadingSpinner } from '@ui-kit';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '@shared/constants';

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  noShow: 'No asistio',
};

const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const HistoryScreen: React.FC = () => {
  const { items, completedCount, noShowCount, loading, error, refresh } = useQueueHistory();

  if (loading) {
    return <LoadingSpinner fullscreen message="Cargando historial..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  const renderItem = ({ item }: { item: QueueItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Badge label={STATUS_LABELS[item.status] ?? item.status} variant={item.status} />
      </View>
      <Text style={styles.phone}>{item.phoneNumber}</Text>
      <Text style={styles.time}>Atendido: {formatTime(item.updatedAt)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Atendidos</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{noShowCount}</Text>
          <Text style={styles.summaryLabel}>No asistieron</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            title="Sin historial hoy"
            subtitle="Todavia no hay turnos completados o no asistidos para el dia de hoy."
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  summaryValue: {
    ...TYPOGRAPHY.h2,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  clientName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  phone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});

export default HistoryScreen;
