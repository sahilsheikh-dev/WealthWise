import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../theme/useTheme';

export const TEXT_ACTIONS_ALLOWED = [
  'Deposit',
  'Withdraw',
  'Pay EMI',
  'Log installment',
  'Entries',
  'Schedule',
  'Payments',
  'Confirm',
  'Save',
  'Continue',
  'Skip for now',
  'Cancel',
  'Try again',
  'Go to Home',
  'Start fresh',
  'Export',
  'Import',
  'Undo import',
  'Share',
  'Create N transactions',
  'Use calculated EMI',
  'Send test notification',
] as const;

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'default',
  disabled = false,
  hint,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'destructive';
  disabled?: boolean;
  hint?: string;
}) {
  const { colors } = useTheme();
  const backgroundColor = variant === 'primary'
    ? colors.primary
    : variant === 'destructive'
      ? colors.errDim
      : colors.surface2;
  const iconColor = variant === 'primary'
    ? colors.surface
    : variant === 'destructive'
      ? colors.err
      : colors.text2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Feather name={icon} size={18} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.76 },
});
