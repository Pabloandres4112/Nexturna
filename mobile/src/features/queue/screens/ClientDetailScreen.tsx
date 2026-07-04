import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../types';
import { useQueue } from '../hooks/useQueue';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants';
import { formatDate, formatTime } from '../utils/formatters';

type DetailNavProp = NativeStackNavigationProp<AppStackParamList, 'ClientDetail'>;
type DetailRouteProp = RouteProp<AppStackParamList, 'ClientDetail'>;

const STATUS_LABELS: Record<string, string> = {
  waiting: 'En espera',
  'in-progress': 'En atencion',
  completed: 'Completado',
  noShow: 'No asistio',
};

const ClientDetailScreen: React.FC = () => {
  const navigation = useNavigation<DetailNavProp>();
  const route = useRoute<DetailRouteProp>();
  const { item } = route.params;
  const { completeItem, removeItem, nextInQueue } = useQueue();
  const [loading, setLoading] = useState(false);

  const runAction = async (action: () => Promise<void>, label: string) => {
    Alert.alert(
      label,
      `Confirmar accion para ${item.clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setLoading(true);
              await action();
              navigation.goBack();
            } catch {
              Alert.alert('Error', `No se pudo ${label.toLowerCase()}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Procesando..." />;
  }

  const isActive =
    item.status === 'waiting' || item.status === 'in-progress';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {item.clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.phone}>{item.phoneNumber}</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>Posicion #{item.position}</Text>
          </View>
          {item.priority && (
            <Badge label="Prioritario" variant="priority" style={styles.badgeGap} />
          )}
          <Badge
            label={STATUS_LABELS[item.status] ?? item.status}
            variant={item.status}
          />
        </View>

        {/* Details */}
        <Text style={styles.sectionLabel}>Detalles del turno</Text>
        <Card style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Estado</Text>
            <Text style={styles.detailValue}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Tiempo estimado</Text>
            <Text style={styles.detailValue}>{formatTime(item.estimatedTimeMinutes)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Ingreso</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.detailRow, styles.noBorder]}>
            <Text style={styles.detailKey}>Fecha de cola</Text>
            <Text style={styles.detailValue}>
              {new Date(item.queueDate).toLocaleDateString('es-CO')}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        {isActive && (
          <>
            <Text style={styles.sectionLabel}>Acciones</Text>
            <Button
              title="Llamar siguiente"
              variant="secondary"
              onPress={() => runAction(nextInQueue, 'Llamar siguiente')}
              style={styles.actionBtn}
            />
            <Button
              title="Marcar como completado"
              variant="primary"
              onPress={() => runAction(() => completeItem(item.id), 'Completar turno')}
              style={styles.actionBtn}
            />
            <Button
              title="Eliminar de la cola"
              variant="danger"
              onPress={() => runAction(() => removeItem(item.id), 'Eliminar de la cola')}
              style={styles.actionBtn}
            />
          </>
        )}

        <Button
          title="Volver"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarLetter: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
  },
  headerText: {
    flex: 1,
  },
  clientName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  phone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
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
  badgeGap: {
    marginLeft: SPACING.xs,
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  detailCard: {
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailKey: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
  detailValue: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  actionBtn: {
    marginBottom: SPACING.sm,
  },
  backBtn: {
    marginTop: SPACING.md,
  },
});

export default ClientDetailScreen;
