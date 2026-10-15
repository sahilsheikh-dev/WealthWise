import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { AmountText } from './AmountText';
import { AppText, Button, StatusBadge } from './ui';
import { PendingItemActions } from './PendingItemActions';
import type { PendingItem } from '../domain/pending';
import { formatDate } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const STATUS_LABELS: Record<PendingItem['status'], string> = {
  overdue: 'Overdue',
  'due-today': 'Due today',
  upcoming: 'Upcoming',
  planned: 'Planned',
};

export function PendingItemActionSheet({
  item,
  today,
  onClose,
  onViewSchedule,
}: {
  item: PendingItem | null;
  today: string;
  onClose: () => void;
  onViewSchedule: (item: PendingItem) => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      {item ? (
        <View testID="pending-item-action-sheet" style={styles.backdrop}>
          <ScrollView contentContainerStyle={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText weight="bold" style={typography.h1}>{item.title}</AppText>
            <View style={styles.summary}>
              <AmountText value={item.amount} tier="tile" weight="bold" />
              <StatusBadge
                label={STATUS_LABELS[item.status]}
                tone={item.status === 'overdue' ? 'err' : item.status === 'due-today' ? 'primary' : 'neutral'}
              />
            </View>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              {item.dueDate ? `Due ${formatDate(item.dueDate)}` : 'Planned'}
            </AppText>
            <PendingItemActions item={item} today={today} onClose={onClose} />
            {item.source.kind === 'plan' ? (
              <Button label="View schedule" icon="calendar" onPress={() => onViewSchedule(item)} />
            ) : item.source.kind === 'liability' ? (
              <Button label="View schedule" icon="calendar" onPress={() => onViewSchedule(item)} />
            ) : null}
            <Button label="Close" onPress={onClose} />
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: '#0008' },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 12, maxHeight: '90%' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
