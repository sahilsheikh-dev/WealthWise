import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      {item ? (
        <View
          testID="pending-item-action-sheet"
          style={[styles.backdrop, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            testID="pending-item-action-sheet-backdrop"
            accessibilityRole="button"
            accessibilityLabel="Close due details"
            onPress={onClose}
            style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.text1}80` }]}
          />
          <ScrollView
            testID="pending-item-action-sheet-content"
            style={[
              styles.sheet,
              {
                maxHeight: height * 0.6,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            contentContainerStyle={styles.sheetContent}
            scrollEnabled
            showsVerticalScrollIndicator={false}>
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
  backdrop: { flex: 1, justifyContent: 'flex-end', paddingTop: 16, paddingHorizontal: 16 },
  sheet: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetContent: { padding: 18, gap: 12 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
