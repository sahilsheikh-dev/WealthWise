import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { SortChip } from '../../src/components/SortChip';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  ListItem,
  Screen,
  SearchField,
  StatPill,
  WarningBanner,
} from '../../src/components/ui';
import { useUIStore } from '../../src/data/uiStore';
import { useAppData } from '../../src/data/useAppData';
import { useSort } from '../../src/data/useSort';
import { availableBalance, reviewableMonths } from '../../src/domain/cashFlow';
import { shiftMonth } from '../../src/domain/dates';
import { describeSource } from '../../src/domain/links';
import { filterTransactions, groupByDate, monthSummary } from '../../src/domain/transactions';
import type { Transaction } from '../../src/domain/types';
import { formatAmount } from '../../src/lib/amountDisplay';
import { todayISO } from '../../src/lib/clock';
import { formatDate, formatMonth } from '../../src/lib/format';
import { SORT_OPTIONS } from '../../src/lib/sorting';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type Filter = 'all' | Transaction['type'];
const transactionTone = {
  income: { tone: 'ok' as const, symbol: '+' },
  expense: { tone: 'err' as const, symbol: '-' },
  invest: { tone: 'primary' as const, symbol: '' },
};

function BalanceLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.balanceLine}>
      <AppText style={typography.meta}>{label}</AppText>
      <AmountText value={value} tier="row" />
    </View>
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function TransactionsScreen() {
  const params = useLocalSearchParams<{ category?: string; month?: string }>();
  const routeCategory = typeof params.category === 'string' ? params.category : '';
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
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
  const [balanceExpanded, setBalanceExpanded] = useState(false);
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
  const position = useMemo(
    () => availableBalance(data.transactions, month, today),
    [data.transactions, month, today],
  );
  const review = useMemo(() => reviewableMonths(data, today)[0], [data, today]);
  const visibleReview = review?.month === dismissedReview ? undefined : review;
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
          rightActions={[{ icon: 'plus', label: 'Add transaction', onPress: () => router.push('/transaction-form') }]}
          menu={[
            { label: 'Record money movement', icon: 'link', onPress: () => setMovementSheetOpen(true) },
            ...(visibleReview ? [{
              label: `Review ${formatMonth(visibleReview.month)}`,
              icon: 'calendar' as const,
              onPress: () => router.push({ pathname: '/month-review', params: { month: visibleReview.month } }),
            }] : []),
          ]}
        />
        <View style={[styles.cashCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${balanceExpanded ? 'Collapse' : 'Expand'} ${position.label}, ${formatAmount(position.amount, 'exact', 1)}${
              Math.abs(position.broughtForward) > 0
                ? `, From ${formatMonth(shiftMonth(month, -1)).slice(0, 3)} ${formatAmount(position.broughtForward, 'exact', 1)}`
                : ''
            }`}
            onPress={() => setBalanceExpanded((expanded) => !expanded)}
            style={styles.balanceHeading}>
            <View style={styles.balanceTitle}>
              <AppText weight="semibold">{position.label}{position.amount < 0 ? ' · Shortfall' : ''}</AppText>
              {visibleReview ? <View style={[styles.reviewDot, { backgroundColor: colors.primary }]} /> : null}
            </View>
            <AmountText value={position.amount} tier="tile" tone={position.amount < 0 ? 'err' : undefined} />
            {Math.abs(position.broughtForward) > 0 ? (
              <View style={[styles.broughtForwardChip, { backgroundColor: colors.bg }]}>
                <AppText style={typography.meta}>From {formatMonth(shiftMonth(month, -1)).slice(0, 3)} </AppText>
                <AmountText value={position.broughtForward} tier="row" />
              </View>
            ) : null}
          </Pressable>
          {balanceExpanded ? (
            <View style={styles.balanceDetails}>
              <BalanceLine label="Brought forward" value={position.broughtForward} />
              <BalanceLine label="Income" value={position.income} />
              <BalanceLine label="Other money in" value={position.otherMoneyIn} />
              {position.otherMoneyIn > 0 ? (
                <AppText style={typography.meta}>
                  Includes {formatAmount(position.otherMoneyIn, 'exact', 1)} from withdrawals, borrowing, loan proceeds and own funds
                </AppText>
              ) : null}
              <BalanceLine label="Spent" value={position.spent} />
              <BalanceLine label="Invested" value={position.invested} />
              {visibleReview ? (
                <View style={styles.reviewRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/month-review', params: { month: visibleReview.month } })}>
                    <AppText weight="semibold" style={{ color: colors.primary }}>Review {formatMonth(visibleReview.month)}</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss month review reminder"
                    onPress={() => setDismissedReview(visibleReview.month)}>
                    <Feather name="x" size={18} color={colors.text3} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
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
          <StatPill
            label="Income"
            value={<AmountText value={summary.income} tier="tile" />}
            accessibilityLabel={`Income, ${formatAmount(summary.income, 'exact', 1)}`}
            tone="ok"
          />
          <StatPill
            label="Expense"
            value={<AmountText value={summary.expense} tier="tile" />}
            accessibilityLabel={`Expense, ${formatAmount(summary.expense, 'exact', 1)}`}
            tone="err"
          />
          <StatPill
            label="Invested"
            value={<AmountText value={summary.invest} tier="tile" />}
            accessibilityLabel={`Invested, ${formatAmount(summary.invest, 'exact', 1)}`}
            tone="primary"
          />
        </View>
        {summary.earnedIncome === 0 ? (
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            No earned income logged this month
          </AppText>
        ) : null}

        {summary.overspend > 0 ? (
          <WarningBanner>
            Spending plus investing is {formatAmount(summary.overspend, 'exact', 1)} more than income this month
          </WarningBanner>
        ) : null}

        <View
          testID="transaction-filter-row"
          style={styles.filterRow}
          onTouchStart={() => setTouchingChips(true)}
          onTouchEnd={() => setTouchingChips(false)}
          onTouchCancel={() => setTouchingChips(false)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroller}
            contentContainerStyle={styles.filterChips}>
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
          </ScrollView>
          <SortChip options={SORT_OPTIONS.transactions} spec={sorting.spec} onChange={sorting.setSpec} />
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
                    amount={`${tone.symbol}${formatAmount(item.amount, 'row', fontScale)}`}
                    accessibilityLabel={`${item.note || item.category}, ${item.category}, ${tone.symbol}${formatAmount(item.amount, 'exact', 1)}`}
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
  filterRow: { minHeight: 44, marginHorizontal: 20, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterScroller: { flex: 1, minWidth: 0 },
  filterChips: { alignItems: 'center', gap: 6 },
  rates: { marginHorizontal: 20, marginTop: 9, gap: 4 },
  savingsLine: { marginHorizontal: 20, marginTop: 9 },
  list: { marginHorizontal: 20, marginTop: 4 },
  dateGroup: { marginTop: 14, marginBottom: 3, fontSize: 11 },
  cashCard: { marginHorizontal: 20, minHeight: 60, maxHeight: 64, padding: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, justifyContent: 'center', gap: 6 },
  balanceHeading: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  broughtForwardChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  balanceDetails: { gap: 7, paddingTop: 7 },
  balanceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  reviewDot: { width: 6, height: 6, borderRadius: 3 },
  modalScrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  movementSheet: { padding: 20, paddingBottom: 34, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 6 },
  sheetTitle: { fontSize: 18, marginBottom: 8 },
  movementRow: { minHeight: 48, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
