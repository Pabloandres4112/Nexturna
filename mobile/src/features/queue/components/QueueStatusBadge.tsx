import React from 'react';
import type { ViewStyle } from 'react-native';
import { Badge } from '@ui-kit';
import type { QueueStatus } from '../types';

interface QueueStatusBadgeProps {
  status: QueueStatus;
  style?: ViewStyle;
}

const STATUS_LABELS: Record<QueueStatus, string> = {
  waiting: 'En espera',
  'in-progress': 'En atencion',
  completed: 'Completado',
  noShow: 'No asistio',
};

/**
 * Wrapper de dominio sobre <Badge> del ui-kit: traduce un QueueStatus
 * a su etiqueta y color, sin que Badge necesite conocer este vocabulario.
 */
const QueueStatusBadge: React.FC<QueueStatusBadgeProps> = ({ status, style }) => (
  <Badge label={STATUS_LABELS[status]} variant={status} style={style} />
);

export default QueueStatusBadge;
