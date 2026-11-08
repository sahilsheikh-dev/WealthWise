import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './ui';
import { useTheme } from '../theme/useTheme';

export function ActionToast({
  message,
  actionLabel,
  onAction,
  onDismiss,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 5_000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <View accessibilityRole="alert" style={[styles.toast, { backgroundColor: colors.surface3 }]}>
      <AppText accessibilityLiveRegion="polite" style={styles.message}>{message}</AppText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.action}>
          <AppText weight="bold" style={{ color: colors.primary }}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: { flex: 1 },
  action: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
});
