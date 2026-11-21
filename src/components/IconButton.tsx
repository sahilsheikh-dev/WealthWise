import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

export const TEXT_ACTIONS_ALLOWED = [
  'Deposit',
  'Withdraw',
  'Pay EMI',
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
  'Clear due',
  'Clear past dues',
  // This short Home action is text-first but keeps the existing due confirmation.
  'Marked as paid',
  // Transactions uses this compact clear-due action.
  'Paid',
  'Undo',
  // These visible labels are intentional exceptions on the Home screen only.
  'New Transaction',
  'New Investment',
  'New Liability',
  'Log Emergency Fund',
] as const;

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'default',
  disabled = false,
  hint,
  labelPosition = 'none',
}: {
  icon: keyof typeof Feather.glyphMap;
  label?: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'destructive';
  disabled?: boolean;
  hint?: string;
  labelPosition?: 'none' | 'below';
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
  const showLabel = labelPosition === 'below' && Boolean(label);
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
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
  // Default: preserve the original icon-only button layout.
  if (!showLabel) {
    return button;
  }
  // Opt-in: show the label outside and below the circle.
  return (
    <View style={styles.labeledContainer}>
      {button}
      <Text
        style={[styles.label, { color: colors.text2 }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
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
  labeledContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.76 },
});
