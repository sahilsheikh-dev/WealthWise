import { Feather } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AmountText } from './AmountText';
import { AppText } from './ui';
import { formatAmount } from '../lib/amountDisplay';
import { useTheme } from '../theme/useTheme';

export function BudgetSummaryToggle({
  label,
  spent,
  planned,
  expanded,
  accessibilityLabel,
  testID,
  onPress,
  progress,
  topBorder = false,
  style,
  children,
}: PropsWithChildren<{
  label: string;
  spent: number;
  planned: number;
  expanded: boolean;
  accessibilityLabel: string;
  testID: string;
  onPress: () => void;
  progress?: number;
  topBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.group, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={[styles.toggle, topBorder && { borderTopColor: colors.border }]}>
        <AppText
          weight="semibold"
          accessibilityLabel={`${label} ${formatAmount(spent, 'exact', 1)} spent of ${formatAmount(planned, 'exact', 1)}`}>
          {label} <AmountText value={spent} tier="tile" /> spent of <AmountText value={planned} tier="tile" />
        </AppText>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {progress !== undefined ? (
        <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: colors.primary }]} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  track: { height: 4, overflow: 'hidden', borderRadius: 2 },
  fill: { height: '100%', borderRadius: 2 },
});
