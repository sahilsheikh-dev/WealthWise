import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from './AmountText';
import { AppText, StatusBadge } from './ui';
import type { PendingItem } from '../domain/pending';
import { formatAmount } from '../lib/amountDisplay';
import { formatDate } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const STATUS_LABELS: Record<PendingItem['status'], string> = {
  overdue: 'Overdue',
  'due-today': 'Due today',
  upcoming: 'Upcoming',
  planned: 'Planned',
};

export function PendingItemRow({
  item,
  onPress,
  actions,
  actualAmount,
  plannedAmount,
  automatic = false,
  statusOverride,
  showDuePrefix = false,
}: {
  item: PendingItem;
  onPress?: () => void;
  actions?: React.ReactNode;
  actualAmount?: number;
  plannedAmount?: number;
  automatic?: boolean;
  statusOverride?: 'paid';
  showDuePrefix?: boolean;
}) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const statusLabel = statusOverride === 'paid' ? 'Paid' : STATUS_LABELS[item.status];
  const dateLabel = item.dueDate
    ? `${showDuePrefix ? 'Due ' : ''}${formatDate(item.dueDate)}`
    : 'Planned';
  const amountLabel = actualAmount === undefined
    ? formatAmount(item.amount, 'exact', 1)
    : `${formatAmount(actualAmount, 'exact', 1)} of ${formatAmount(plannedAmount ?? item.amount, 'exact', 1)}`;
  const accessibilityLabel = `${item.title}, ${statusLabel}, ${dateLabel}, ${automatic ? 'Auto, ' : ''}${amountLabel}`;
  const content = (
    <>
      <View style={[styles.details, fontScale >= 1.3 && styles.detailsStacked]}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <AppText weight="semibold" style={typography.name}>{item.title}</AppText>
            {automatic ? <AppText style={[typography.meta, { color: colors.primary }]}>Auto</AppText> : null}
          </View>
          <AppText style={[typography.meta, { color: colors.text3 }]}>
                {dateLabel}
          </AppText>
        </View>
        <View style={[styles.amountStatus, fontScale >= 1.3 && styles.amountStatusStacked]}>
          {actualAmount !== undefined && plannedAmount !== undefined ? (
            <AppText weight="semibold">
              <AmountText value={actualAmount} tier="row" /> / <AmountText value={plannedAmount} tier="row" />
            </AppText>
          ) : (
            <AmountText value={item.amount} tier="row" weight="semibold" />
          )}
          <StatusBadge
            label={statusLabel}
            tone={statusOverride === 'paid' ? 'ok' : item.status === 'overdue' ? 'err' : item.status === 'due-today' ? 'primary' : 'neutral'}
          />
        </View>
      </View>
      {actions}
    </>
  );

  if (!onPress) {
    return (
      <View
        testID={`pending-item-${item.id}`}
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        style={[styles.row, { borderBottomColor: colors.border }]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={`pending-item-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 9, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  details: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  detailsStacked: { alignItems: 'stretch', flexDirection: 'column' },
  titleBlock: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  amountStatus: { alignItems: 'flex-end', gap: 5 },
  amountStatusStacked: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap' },
});
