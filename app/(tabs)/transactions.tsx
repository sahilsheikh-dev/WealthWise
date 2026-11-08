import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  ListItem,
  Screen,
  SearchField,
  StatPill,
  WarningBanner,
} from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { SortChip } from '../../src/components/SortChip';
import { useUIStore } from '../../src/data/uiStore';
import { useSort } from '../../src/data/useSort';
import { useAppData } from '../../src/data/useAppData';
import { shiftMonth } from '../../src/domain/dates';
import { describeSource } from '../../src/domain/links';
import { monthPositionAt, reviewableMonths } from '../../src/domain/cashFlow';
import { filterTransactions, groupByDate, monthSummary } from '../../src/domain/transactions';
import type { Transaction } from '../../src/domain/types';
import { formatDate, formatINR, formatMonth } from '../../src/lib/format';
import { SORT_OPTIONS } from '../../src/lib/sorting';
import { todayISO } from '../../src/lib/clock';
import { savingsLine } from '../../src/lib/savingsLine';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type Filter = 'all' | Transaction['type'];
const transactionTone = {
  income: { tone: 'ok' as const, symbol: '+' },
  expense: { tone: 'err' as const, symbol: '-' },
  invest: { tone: 'primary' as const, symbol: '' },
};

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function TransactionsScreen() {
  const params = useLocalSearchParams<{ category?: string; month?: string }>();
  const routeCategory = typeof params.category === 'string' ? params.category : '';
  const { colors } = useTheme();
  const data = useAppData();
  const month = useUIStore((state) => state.txMonth);
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const sorting = useSort('transactions');
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const categoryFilter = categoryOverride ?? routeCategory;
  const [query, setQuery] = useState('');
  const [movementSheetOpen, setMovementSheetOpen] = useState(false);
  const [dismissedReview, setDismissedReview] = useState<string | null>(null);
  const today = useMemo(() => todayISO(), []);
  const [touchingChips, setTouchingChips] = useState(false);
  useEffect(() => {
    if (params.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month)) setTxMonth(params.month);
  }, [params.month, setTxMonth]);
  const monthPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      !touchingChips && swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx }) !== null,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, gesture) => {
      const intent = swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx });
      if (intent) setTxMonth(shiftMonth(month, intent === 'next' ? 1 : -1));
    },
  }), [month, setTxMonth, touchingChips]);
  const summary = useMemo(() => monthSummary(data.transactions, month), [data.transactions, month]);
  const position = useMemo(() => monthPositionAt(data.transactions, month), [data.transactions, month]);
  const review = useMemo(
    () => reviewableMonths(data, today).find((item) => item.month === month),
    [data, month, today],
  );
  const savings = savingsLine(summary);
  const creationOrder = useMemo(
    () => new Map(data.transactions.map((transaction, index) => [transaction.id, index])),
    [data.transactions],
  );
  const filteredRows = useMemo(
    () => filterTransactions(data.transactions, { month, type: filter, query, category: categoryFilter }).map((transaction) => ({
      ...transaction,
      sortCreatedIndex: creationOrder.get(transaction.id) ?? 0,
    })),
    [categoryFilter, creationOrder, data.transactions, filter, month, query],
  );
  const rows = sorting.sort(filteredRows);
  const groups = useMemo(() => groupByDate(rows), [rows]);
  const hasMonthTransactions = data.transactions.some((item) => item.date.startsWith(month));
  const movements = [
    { label: 'Spent money', route: '/transaction-form' as const, type: 'expense' as const },
    { label: 'Earned money', route: '/transaction-form' as const, type: 'income' as const },
    { label: 'Invested money', route: '/transaction-form' as const, type: 'invest' as const },
    { label: 'Money from friend or family', route: '/money-movement-form' as const, kind: 'borrowed-in' },
    { label: 'Loan received', route: '/liability-form' as const, received: '1' },
    { label: 'Repaid a friend or loan', route: '/money-movement-form' as const, kind: 'repay' },
    { label: 'Took money out of savings or investments', route: '/money-movement-form' as const, kind: 'withdraw' },
    { label: 'Used my own funds', route: '/money-movement-form' as const, kind: 'own-funds' },
  ];

  return (
    <Screen scroll={false}>
      <View style={styles.gestureSurface} {...monthPanResponder.panHandlers}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Transactions"
          rightActions={[{ icon: 'plus', label: 'Add transaction', onPress: () => setMovementSheetOpen(true) }]}
        />
        <Card style={styles.cashCard}>
          <AppText weight="semibold">{position.opening < 0 ? 'Shortfall brought forward' : 'Brought forward'}</AppText>
          <AppText style={{ color: colors.text2 }}>{formatINR(Math.abs(position.opening))}</AppText>
          <AppText style={typography.meta}>
            This month’s flow {formatINR(position.closing - position.opening)}
          </AppText>
          <AppText weight="semibold">Closing balance {formatINR(position.closing)}</AppText>
        </Card>
        {review && dismissedReview !== month ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Review this month's cash flow"
            onPress={() => router.push({ pathname: '/month-review', params: { month } })}
            style={[styles.reviewBanner, { backgroundColor: colors.errDim, borderColor: colors.err }]}>
            <View style={styles.reviewCopy}>
              <AppText weight="semibold">
                {review.closing < 0
                  ? `You spent ${formatINR(Math.abs(review.closing))} more than you received in ${formatMonth(month)}. How was it funded?`
                  : `You had ${formatINR(review.closing)} left over from ${formatMonth(month)}.`}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss month review reminder"
              hitSlop={10}
              onPress={(event) => {
                event.stopPropagation();
                setDismissedReview(month);
              }}>
              <AppText weight="bold">×</AppText>
            </Pressable>
          </Pressable>
        ) : null}
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => setTxMonth(shiftMonth(month, -1))}
            style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="chevron-left" size={18} color={colors.text2} />
          </Pressable>
          <Pressable
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`Selected month: ${formatMonth(month)}`}
            accessibilityActions={[{ name: 'decrement', label: 'Previous month' }, { name: 'increment', label: 'Next month' }]}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === 'decrement') setTxMonth(shiftMonth(month, -1));
              if (nativeEvent.actionName === 'increment') setTxMonth(shiftMonth(month, 1));
            }}
            style={styles.monthAdjustable}>
            <AppText weight="semibold" style={styles.monthLabel}>{formatMonth(month)}</AppText>
          </Pressable>
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
        {summary.nonEarnedIncome > 0 ? (
          <AppText style={[typography.meta, styles.savingsLine, { color: colors.text3 }]}>
            Includes {formatINR(summary.nonEarnedIncome)} from withdrawals, borrowing, loan proceeds and own funds
          </AppText>
        ) : null}
        {savings.kind === 'rates' ? (
          <View style={styles.rates}>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              {savings.basis === 'earned income'
                ? `Saved ${savings.savedPct.toFixed(1)}% of earned income`
                : `Saved ${savings.savedPct.toFixed(1)}% of income after expenses`}
            </AppText>
            <AppText style={[typography.meta, { color: colors.primary }]}>
              Invested {savings.investedPct.toFixed(1)}%
            </AppText>
          </View>
        ) : savings.kind === 'no-earned-income' ? (
          <AppText style={[typography.meta, styles.savingsLine, { color: colors.text3 }]}>
            No earned income logged this month
          </AppText>
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

        <View
          onTouchStart={() => setTouchingChips(true)}
          onTouchEnd={() => setTouchingChips(false)}
          onTouchCancel={() => setTouchingChips(false)}>
          <ChipRow>
            {(['all', 'income', 'expense', 'invest'] as const).map((item) => (
              <Chip
                key={item}
                label={item === 'all' ? 'All' : item === 'invest' ? 'Invested' : `${item[0]?.toUpperCase()}${item.slice(1)}`}
                selected={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
            {categoryFilter ? (
              <Chip
                label={`Category: ${categoryFilter} ×`}
                selected
                onPress={() => setCategoryOverride('')}
              />
            ) : null}
            <SortChip options={SORT_OPTIONS.transactions} spec={sorting.spec} onChange={sorting.setSpec} />
          </ChipRow>
        </View>
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
                const linked = item.source
                  ? describeSource(data, item.source)
                  : null;
                return (
                  <ListItem
                    key={item.id}
                    title={item.note || item.category}
                    subtitle={linked ? `${item.category}\n→ ${linked.label}` : item.category}
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
      </View>
      <Modal
        visible={movementSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMovementSheetOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setMovementSheetOpen(false)}>
          <Pressable
            accessibilityViewIsModal
            onPress={(event) => event.stopPropagation()}
            style={[styles.movementSheet, { backgroundColor: colors.surface }]}>
            <AppText weight="bold" style={styles.sheetTitle}>What happened?</AppText>
            {movements.map((movement) => (
              <Pressable
                accessibilityRole="button"
                key={movement.label}
                onPress={() => {
                  setMovementSheetOpen(false);
                  if ('kind' in movement) {
                    router.push({ pathname: movement.route, params: { kind: movement.kind } });
                  } else if ('type' in movement) {
                    router.push({ pathname: movement.route, params: { type: movement.type } });
                  } else if ('received' in movement) {
                    router.push({ pathname: movement.route, params: { received: movement.received } });
                  }
                }}
                style={[styles.movementRow, { borderBottomColor: colors.border }]}>
                <AppText>{movement.label}</AppText>
              </Pressable>
            ))}
            <Button label="Cancel" onPress={() => setMovementSheetOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  monthRow: { minHeight: 48, marginHorizontal: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 22 },
  monthLabel: { fontSize: 14 },
  monthAdjustable: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  metrics: { marginHorizontal: 20, marginTop: 8, flexDirection: 'row', gap: 7 },
  rates: { marginHorizontal: 20, marginTop: 9, gap: 4 },
  savingsLine: { marginHorizontal: 20, marginTop: 9 },
  list: { marginHorizontal: 20, marginTop: 4 },
  dateGroup: { marginTop: 14, marginBottom: 3, fontSize: 11 },
  cashCard: { gap: 5 },
  reviewBanner: { marginHorizontal: 20, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewCopy: { flex: 1 },
  modalScrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  movementSheet: { padding: 20, paddingBottom: 34, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 6 },
  sheetTitle: { fontSize: 18, marginBottom: 8 },
  movementRow: { minHeight: 48, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
