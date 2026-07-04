import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  rightElement?: React.ReactNode;
  secureToggle?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, rightElement, secureToggle, secureTextEntry, style, ...rest }, ref) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.inputWrapper,
            error ? styles.inputWrapperError : null,
          ]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={secureToggle ? isSecure : secureTextEntry}
            {...rest}
          />
          {secureToggle ? (
            <TouchableOpacity
              onPress={() => setIsSecure((v) => !v)}
              style={styles.rightBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.toggleText}>
                {isSecure ? 'Mostrar' : 'Ocultar'}
              </Text>
            </TouchableOpacity>
          ) : rightElement ? (
            <View style={styles.rightBtn}>{rightElement}</View>
          ) : null}
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hintText}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
  },
  rightBtn: {
    paddingHorizontal: SPACING.md,
  },
  toggleText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});

export default Input;
