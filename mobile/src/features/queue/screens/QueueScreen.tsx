import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, QueueItem } from '../types';
import { useQueue } from '../hooks/useQueue';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../constants';

type QueueNavProp = NativeStackNavigationProp<AppStackParamList, 'Queue'>;

const STATUS_LABELS: Record<string, string> = {
  waiting: 'En espera',
  'in-progress': 'En atencion',
  completed: 'Completado',
  noShow: 'No asistio',
};

const QueueScreen: React.FC = () => {
  const navigation = useNavigation<QueueNavProp>();
  const {
    queue,
    loading,
    error,
    refresh,
    nextInQueue,
    completeItem,
    removeItem,
  } = useQueue();
  const [actionLoading, setActionLoading] = useState(false);

  const activeQueue = queue.filter(
    (i) => i.status === 'waiting' || i.status === 'in-progress',
  );

  const handleNext = async () => {
    try {
      setActionLoading(true);
      await nextInQueue();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'No se pudo avanzar al siguiente turno';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = (item: QueueItem) => {
    Alert.alert(
      'Completar turno',
      `Marcar el turno de ${item.clientName} como completado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              setActionLoading(true);
              await completeItem(item.id);
            } catch (caughtError) {
              const message =
                caughtError instanceof Error ? caughtError.message : 'No se pudo completar el turno';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRemove = (item: QueueItem) => {
    Alert.alert(
      'Eliminar turno',
      `Eliminar a ${item.clientName} de la cola?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await removeItem(item.id);
            } catch (caughtError) {
              const message =
                caughtError instanceof Error ? caughtError.message : 'No se pudo eliminar el turno';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Cargando cola..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  const renderItem = ({ item }: { item: QueueItem }) => {
    const isCurrent = item.status === 'in-progress';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ClientDetail', { item })}
        style={[styles.card, isCurrent && styles.cardActive]}>
        {isCurrent && (
          <View style={styles.activeBar} />
        )}
        <View style={styles.cardHeader}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>#{item.position}</Text>
          </View>
          <View style={styles.badgesRow}>
            {item.priority && (
              <Badge label="Prioritario" variant="priority" style={styles.badgeGap} />
            )}
            <Badge
              label={STATUS_LABELS[item.status] ?? item.status}
              variant={item.status}
            />
          </View>
        </View>

        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.phone}>{item.phoneNumber}</Text>
        <Text style={styles.time}>Tiempo est.: {item.estimatedTimeMinutes} min</Text>

        <View style={styles.cardActions}>
          {item.status !== 'completed' && item.status !== 'noShow' && (
            <>
              <TouchableOpacity
                style={styles.actionBtnComplete}
                onPress={() => handleComplete(item)}>
                <Text style={styles.actionBtnText}>Completar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnRemove}
                onPress={() => handleRemove(item)}>
                <Text style={styles.actionBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cola de Turnos</Text>
        <Text style={styles.subtitle}>{activeQueue.length} en espera</Text>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title="Cola vacia"
            subtitle="No hay clientes en la cola. Agrega uno para comenzar."
          />
        }
      />

      <View style={styles.footer}>
        <Button
          title={actionLoading ? 'Procesando...' : 'Siguiente turno'}
          onPress={handleNext}
          loading={actionLoading}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
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
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: COLORS.secondary,
    ...SHADOW.md,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingLeft: 8,
  },
  positionBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  positionText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeGap: {
    marginRight: SPACING.xs,
  },
  clientName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    paddingLeft: 8,
    marginBottom: 2,
  },
  phone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    paddingLeft: 8,
    marginBottom: 2,
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    paddingLeft: 8,
    marginBottom: SPACING.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingLeft: 8,
  },
  actionBtnComplete: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
  },
  actionBtnRemove: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default QueueScreen;
