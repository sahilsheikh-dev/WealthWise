import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Chip,
  ChipRow,
  EmptyState,
  Fab,
  ListItem,
  Screen,
  ScreenHeader,
  SearchField,
  StatPill,
  WarningBanner,
} from '../../src/components/ui';
import { useUIStore } from '../../src/data/uiStore';
import { useAppData } from '../../src/data/useAppData';
import { shiftMonth } from '../../src/domain/dates';
import { filterTransactions, groupByDate, monthSummary } from '../../src/domain/transactions';
import type { Transaction } from '../../src/domain/types';
import { formatDate, formatINR, formatMonth } from '../../src/lib/format';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type Filter = 'all' | Transaction['type'];
const transactionTone = {
  income: { tone: 'ok' as const, symbol: '+' },
  expense: { tone: 'err' as const, symbol: '-' },
  invest: { tone: 'primary' as const, symbol: '' },
};

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const month = useUIStore((state) => state.txMonth);
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const summary = useMemo(() => monthSummary(data.transactions, month), [data.transactions, month]);
  const rows = useMemo(
    () => filterTransactions(data.transactions, { month, type: filter, query }),
    [data.transactions, filter, month, query],
  );
  const groups = useMemo(() => groupByDate(rows), [rows]);
  const hasMonthTransactions = data.transactions.some((item) => item.date.startsWith(month));

  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Transactions" />
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => setTxMonth(shiftMonth(month, -1))}
            style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="chevron-left" size={18} color={colors.text2} />
          </Pressable>
          <AppText weight="semibold" style={styles.monthLabel}>{formatMonth(month)}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => setTxMonth(shiftMonth(month, 1))}
            style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="chevron-right" size={18} color={colors.text2} />
          </Pressable>
        </View>

        <View style={styles.metrics}>
          <StatPill label="Income" value={formatINR(summary.income)} tone="ok" />
          <StatPill label="Expense" value={formatINR(summary.expense)} tone="err" />
          <StatPill label="Invested" value={formatINR(summary.invest)} tone="primary" />
        </View>
        {summary.income > 0 ? (
          <View style={styles.rates}>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              Saved {summary.savedPct!.toFixed(1)}% of income (income minus expenses)
            </AppText>
            <AppText style={[typography.meta, { color: colors.primary }]}>
              Invested {summary.investedPct!.toFixed(1)}%
            </AppText>
          </View>
        ) : (
          <AppText style={[typography.meta, styles.savingsLine, { color: colors.text3 }]}>
            No income logged this month
          </AppText>
        )}
        {summary.overspend > 0 ? (
          <WarningBanner>
            Spending plus investing is {formatINR(summary.overspend)} more than income this month
          </WarningBanner>
        ) : null}

        <ChipRow>
          {(['all', 'income', 'expense', 'invest'] as const).map((item) => (
            <Chip
              key={item}
              label={item === 'all' ? 'All' : item === 'invest' ? 'Invested' : `${item[0]?.toUpperCase()}${item.slice(1)}`}
              selected={filter === item}
              onPress={() => setFilter(item)}
            />
          ))}
        </ChipRow>
        <SearchField
          accessibilityLabel="Search transactions"
          placeholder="Search note or category"
          value={query}
          onChangeText={setQuery}
        />

        <View style={styles.list}>
          {!hasMonthTransactions ? (
            <EmptyState title="No transactions this month" subtitle="Try another month to see your activity." />
          ) : groups.length === 0 ? (
            <EmptyState title="No matching transactions" subtitle="Try another filter or search term." />
          ) : groups.map((group) => (
            <View key={group.date}>
              <AppText weight="bold" style={[styles.dateGroup, { color: colors.text3 }]}>{formatDate(group.date)}</AppText>
              {group.items.map((item) => {
                const tone = transactionTone[item.type];
                return (
                  <ListItem
                    key={item.id}
                    title={item.note || item.category}
                    subtitle={item.category}
                    amount={`${tone.symbol}${formatINR(item.amount)}`}
                    tone={tone.tone}
                    icon={item.type === 'income' ? 'arrow-down-left' : item.type === 'expense' ? 'arrow-up-right' : 'trending-up'}
                    onPress={() => router.push({ pathname: '/transaction-form', params: { id: item.id } })}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <Fab label="Add Transaction" onPress={() => router.push('/transaction-form')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  monthRow: { minHeight: 48, marginHorizontal: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 22 },
  monthLabel: { fontSize: 14 },
  metrics: { marginHorizontal: 20, marginTop: 8, flexDirection: 'row', gap: 7 },
  rates: { marginHorizontal: 20, marginTop: 9, gap: 4 },
  savingsLine: { marginHorizontal: 20, marginTop: 9 },
  list: { marginHorizontal: 20, marginTop: 4 },
  dateGroup: { marginTop: 14, marginBottom: 3, fontSize: 11 },
});
