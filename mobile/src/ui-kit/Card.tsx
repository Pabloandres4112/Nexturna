import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOW, SPACING } from '../constants';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  pressable = false,
  noPadding = false,
  ...rest
}) => {
  if (pressable) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, noPadding ? null : styles.padded, style]}
        {...rest}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, noPadding ? null : styles.padded, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  padded: {
    padding: SPACING.md,
  },
});

export default Card;
