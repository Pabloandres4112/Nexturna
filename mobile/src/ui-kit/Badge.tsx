import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants';
import { QueueStatus } from '../types';

type BadgeVariant = QueueStatus | 'priority' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  waiting: { bg: COLORS.warningLight, text: COLORS.warning },
  'in-progress': { bg: COLORS.secondaryLight, text: COLORS.secondary },
  completed: { bg: '#f0fdf4', text: '#16a34a' },
  noShow: { bg: COLORS.dangerLight, text: COLORS.danger },
  priority: { bg: '#fdf4ff', text: '#9333ea' },
  info: { bg: COLORS.infoLight, text: COLORS.info },
  neutral: { bg: COLORS.border, text: COLORS.gray },
};

const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const colors = VARIANT_COLORS[variant] ?? VARIANT_COLORS.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});

export default Badge;
