import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { SortChip } from '../src/components/SortChip';
import { AppText, Button, ChipRow, EmptyState, ListItem, Screen } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { findUnlinkedEntries } from '../src/domain/instruments';
import { formatAmount } from '../src/lib/amountDisplay';
import { confirmAsync } from '../src/lib/confirm';
import { formatDate } from '../src/lib/format';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LinkMissingScreen() {
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const sorting = useSort('linkMissing');
  const { colors } = useTheme();
  const sort = sorting.sort;
  const entries = useMemo(() => sort(findUnlinkedEntries(data).map((item) => ({
    ...item,
    id: `${item.kind}:${item.kind === 'holding' ? item.holdingId : item.kind === 'liability' ? item.liabilityId : 'ef'}:${item.entry.id}`,
    date: item.entry.date,
    amount: Math.abs(item.entry.amount),
  }))), [data, sort]);
  const total = entries.reduce((sum, item) => sum + Math.abs(item.entry.amount), 0);

  const createTransactions = () => {
    const count = entries.length;
    if (count === 0) return;
    void confirmAsync({
      title: 'Create missing transactions?',
      message: `This adds ${count} transactions dated in the past and changes past income, investment and expense totals.`,
      confirmLabel: `Create ${count} transactions`,
      cancelLabel: 'Cancel',
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.createMissingTransactions();
      if (!useAppStore.getState().lastError) router.back();
    });
  };

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Link missing transactions" showBack />
        <FormErrorBanner message={lastError} />
        {entries.length === 0 ? (
          <EmptyState title="All entries are linked" subtitle="There are no missing transactions to create." />
        ) : (
          <>
            <View style={{marginHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between'}}>
              <AppText style={[typography.meta, { color: colors.text2 }]}>
              This tool creates transactions for existing entries that do not have one yet.
              These entries are dated in the past and will change past income, invest and expense totals.
            </AppText>
            </View>
            <View style={styles.total}>
              <AppText style={[typography.meta, { color: colors.text3 }]}>Total transaction amount</AppText>
              <AmountText value={total} tier="hero" weight="bold" />
            </View>
            <ChipRow>
              <SortChip options={SORT_OPTIONS.linkMissing} spec={sorting.spec} onChange={sorting.setSpec} />
            </ChipRow>
            <View style={styles.list}>
              {entries.map((item) => {
                const name = item.kind === 'ef'
                  ? 'Emergency fund'
                  : item.kind === 'holding' ? item.holdingName : item.liabilityName;
                const kind = item.kind === 'liability'
                  ? item.entry.kind
                  : item.entry.amount < 0 || item.kind === 'holding' && item.entry.kind === 'Withdrawal'
                    ? 'Withdrawal'
                    : 'Deposit';
                return (
                  <ListItem
                    key={`${item.kind}:${item.kind === 'holding' ? item.holdingId : item.kind === 'liability' ? item.liabilityId : 'ef'}:${item.entry.id}`}
                    title={name}
                    subtitle={`${formatDate(item.entry.date)} · ${kind}`}
                    amount={<AmountText value={Math.abs(item.entry.amount)} tier="row" />}
                    accessibilityLabel={`${name}, ${formatDate(item.entry.date)}, ${kind}, ${formatAmount(Math.abs(item.entry.amount), 'exact', 1)}`}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      {entries.length > 0 ? (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
          <Button
            label={`Create ${entries.length} transactions`}
            icon="layers"
            variant="primary"
            onPress={createTransactions}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  total: { marginHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' },
  list: { marginHorizontal: 20 },
  sortRow: { marginHorizontal: 20 },
  footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
});
