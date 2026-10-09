import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Chip,
  ChipRow,
  Fab,
  ListItem,
  Screen,
  ScreenHeader,
  SearchField,
  StatPill,
  WarningBanner,
} from '../../src/components/ui';
import { formatDate, formatINR, formatMonth } from '../../src/lib/format';
import { transactions } from '../../src/mock/data';
import type { Transaction } from '../../src/domain/types';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type Filter = 'all' | Transaction['type'];

const currentMonth = '2026-10';
const transactionTone = {
  income: { tone: 'ok' as const, symbol: '+' },
  expense: { tone: 'err' as const, symbol: '-' },
  invest: { tone: 'primary' as const, symbol: '' },
};

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const monthRows = useMemo(() => transactions.filter((item) => item.date.startsWith(currentMonth)), []);
  const sums = useMemo(
    () => ({
      income: monthRows.filter((item) => item.type === 'income').reduce((total, item) => total + item.amount, 0),
      expense: monthRows.filter((item) => item.type === 'expense').reduce((total, item) => total + item.amount, 0),
      invest: monthRows.filter((item) => item.type === 'invest').reduce((total, item) => total + item.amount, 0),
    }),
    [monthRows],
  );
  const rows = useMemo(
    () =>
      monthRows
        .filter((item) => filter === 'all' || item.type === filter)
        .filter((item) => `${item.note} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
        .sort((left, right) => right.date.localeCompare(left.date)),
    [filter, monthRows, query],
  );

  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Transactions" />
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => {}}
          style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="chevron-left" size={18} color={colors.text2} />
        </Pressable>
        <AppText weight="semibold" style={styles.monthLabel}>{formatMonth(currentMonth)}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => {}}
          style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="chevron-right" size={18} color={colors.text2} />
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <StatPill label="Income" value={formatINR(sums.income)} tone="ok" />
        <StatPill label="Expense" value={formatINR(sums.expense)} tone="err" />
        <StatPill label="Invested" value={formatINR(sums.invest)} tone="primary" />
      </View>
      <AppText style={[typography.meta, styles.savingsLine, { color: colors.text3 }]}>
        Savings rate {sums.income ? Math.round((sums.invest / sums.income) * 100) : 0}% of income
      </AppText>
      <WarningBanner>Rent and family support are your largest expenses this month.</WarningBanner>

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
        {rows.map((item, index) => {
          const previous = rows[index - 1];
          const tone = transactionTone[item.type];
          return (
            <View key={item.id}>
              {item.date !== previous?.date ? (
                <AppText weight="bold" style={[styles.dateGroup, { color: colors.text3 }]}>{formatDate(item.date)}</AppText>
              ) : null}
              <ListItem
                title={item.note || item.category}
                subtitle={item.category}
                amount={`${tone.symbol}${formatINR(item.amount)}`}
                tone={tone.tone}
                icon={item.type === 'income' ? 'arrow-down-left' : item.type === 'expense' ? 'arrow-up-right' : 'trending-up'}
              />
            </View>
          );
        })}
        {rows.length === 0 ? (
          <AppText style={[typography.meta, styles.noResults, { color: colors.text3 }]}>No transactions match your search.</AppText>
        ) : null}
      </View>
      </ScrollView>
      <Fab label="Add transaction" onPress={() => {
        // TODO(phase5)
      }} />
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
  savingsLine: { marginHorizontal: 20, marginTop: 9 },
  list: { marginHorizontal: 20, marginTop: 4 },
  dateGroup: { marginTop: 14, marginBottom: 3, fontSize: 11 },
  noResults: { marginTop: 20, textAlign: 'center' },
});
