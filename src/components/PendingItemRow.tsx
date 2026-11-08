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
}: {
  item: PendingItem;
  onPress?: () => void;
  actions?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const content = (
    <>
      <View style={[styles.details, fontScale >= 1.3 && styles.detailsStacked]}>
        <View style={styles.titleBlock}>
          <AppText weight="semibold" style={typography.name}>{item.title}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            {item.dueDate ? formatDate(item.dueDate) : 'Planned'}
          </AppText>
        </View>
        <View style={[styles.amountStatus, fontScale >= 1.3 && styles.amountStatusStacked]}>
          <AmountText value={item.amount} tier="row" weight="semibold" />
          <StatusBadge
            label={STATUS_LABELS[item.status]}
            tone={item.status === 'overdue' ? 'err' : item.status === 'due-today' ? 'primary' : 'neutral'}
          />
        </View>
      </View>
      {actions}
    </>
  );

  if (!onPress) {
    return <View testID={`pending-item-${item.id}`} style={[styles.row, { borderBottomColor: colors.border }]}>{content}</View>;
  }
  return (
    <Pressable
      testID={`pending-item-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${STATUS_LABELS[item.status]}, ${item.dueDate ? formatDate(item.dueDate) : 'Planned'}, ${formatAmount(item.amount, 'exact', 1)}`}
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
  amountStatus: { alignItems: 'flex-end', gap: 5 },
  amountStatusStacked: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap' },
});
