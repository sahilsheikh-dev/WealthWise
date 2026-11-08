import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { PendingItemActions } from '../../src/components/PendingItemActions';
import { PendingItemRow } from '../../src/components/PendingItemRow';
import { SortChip } from '../../src/components/SortChip';
import {
  AppText,
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
import { useUIStore } from '../../src/data/uiStore';
import { useAppData } from '../../src/data/useAppData';
import { useSort } from '../../src/data/useSort';
import { availableBalance, reviewableMonths } from '../../src/domain/cashFlow';
import { customBudgetCategories } from '../../src/domain/budget';
import { shiftMonth } from '../../src/domain/dates';
import { findUnlinkedEntries } from '../../src/domain/instruments';
import { describeSource } from '../../src/domain/links';
import { pendingItems, pendingTransactionType } from '../../src/domain/pending';
import { filterTransactions, groupByDate, monthSummary, transactionCategoryLabel } from '../../src/domain/transactions';
import type { Transaction } from '../../src/domain/types';
import { formatAmount } from '../../src/lib/amountDisplay';
import { todayISO } from '../../src/lib/clock';
import { formatDate, formatMonth } from '../../src/lib/format';
import { DEFAULT_SORTS, SORT_OPTIONS } from '../../src/lib/sorting';
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
  const { fontScale } = useWindowDimensions();
  const data = useAppData();
  const month = useUIStore((state) => state.txMonth);
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const sorting = useSort('transactions');
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const categoryFilter = categoryOverride ?? routeCategory;
  const [query, setQuery] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
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
  const budgetCategories = useMemo(() => customBudgetCategories(data), [data]);
  const monthPendingItems = useMemo(() => pendingItems(data, month, today), [data, month, today]);
  const visiblePendingItems = useMemo(() => monthPendingItems.filter((item) => {
    const type = pendingTransactionType(item);
    return (filter === 'all' || type === filter)
      && (!categoryFilter || item.category === categoryFilter)
      && (!query || `${item.title} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  }), [categoryFilter, filter, monthPendingItems, query]);
  const unlinkedCount = useMemo(() => findUnlinkedEntries(data).length, [data]);
  const position = useMemo(
    () => availableBalance(data.transactions, month, today),
    [data.transactions, month, today],
  );
  const review = useMemo(() => reviewableMonths(data, today)[0], [data, today]);
  const creationOrder = useMemo(
    () => new Map(data.transactions.map((transaction, index) => [transaction.id, index])),
    [data.transactions],
  );
  const filteredRows = useMemo(
    () => filterTransactions(data.transactions, {
      month, type: filter, query, category: categoryFilter, customCategories: budgetCategories,
    }).map((transaction) => ({
      ...transaction,
      sortCreatedIndex: creationOrder.get(transaction.id) ?? 0,
    })),
    [budgetCategories, categoryFilter, creationOrder, data.transactions, filter, month, query],
  );
  const rows = sorting.sort(filteredRows);
  const groups = useMemo(() => groupByDate(rows), [rows]);
  const hasMonthTransactions = data.transactions.some((item) => item.date.startsWith(month));
  const filterActive = filter !== 'all' || categoryFilter !== ''
    || sorting.spec.key !== DEFAULT_SORTS.transactions.key
    || sorting.spec.dir !== DEFAULT_SORTS.transactions.dir;
  return (
    <Screen scroll={false}>
      <View style={styles.gestureSurface} {...monthPanResponder.panHandlers}>
      <ScrollView testID="transactions-content-scroll" style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Transactions"
          menuPlacement="leading"
          rightActions={[
            {
              icon: 'filter',
              label: 'Filter',
              onPress: () => setFilterPanelOpen((open) => !open),
              expanded: filterPanelOpen,
              showIndicator: filterActive,
            },
            { icon: 'plus', label: 'Add transaction', onPress: () => router.push('/transaction-form') },
          ]}
          menu={[
            { label: 'Link missing transactions', icon: 'link', onPress: () => router.push('/link-missing') },
          ]}
        />
        {filterPanelOpen ? (
          <View
            testID="transaction-filter-panel"
            onTouchStart={() => setTouchingChips(true)}
            onTouchEnd={() => setTouchingChips(false)}
            onTouchCancel={() => setTouchingChips(false)}>
            <ChipRow>
              <SortChip options={SORT_OPTIONS.transactions} spec={sorting.spec} onChange={sorting.setSpec} />
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
                  label={`Category: ${transactionCategoryLabel(categoryFilter, undefined, budgetCategories)} ×`}
                  selected
                  onPress={() => setCategoryOverride('')}
                />
              ) : null}
            </ChipRow>
          </View>
        ) : null}
        <View testID="available-balance-card" style={{marginTop: 10}}>
          <Card style={styles.cashCard}>
          <View style={styles.balanceSummary}>
            <View style={styles.balanceTitle}>
              <AppText style={[typography.meta, styles.balanceLabel, { color: colors.text3 }]} numberOfLines={1}>
                {position.label}{position.amount < 0 ? ' (Shortfall From ' + formatMonth(shiftMonth(month, -1)).slice(0, 3) + ')': ''}
              </AppText>
            </View>
            <View style={styles.balanceActions}>
              {Math.abs(position.broughtForward) > 0 ? (
                <View style={[styles.broughtForwardChip, { backgroundColor: colors.bg }]}>
                  <AmountText value={position.amount} tier="tile" weight="bold" tone={position.amount < 0 ? 'err' : undefined} style={styles.balanceValue} />
                </View>
              ) : null}
            </View>
          </View>
          <View testID="available-balance-divider" style={[styles.balanceDivider, { backgroundColor: colors.border }]} />
              {review ? (
                <View style={styles.reviewRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Review ${formatMonth(review.month)}`}
                    onPress={() => router.push({ pathname: '/(tabs)/budget', params: { month: review.month } })}>
                    <AppText weight="semibold" style={{ color: colors.primary }}>Review {formatMonth(review.month)}</AppText>
                  </Pressable>
                </View>
              ) : null}
          </Card>
        </View>
        {unlinkedCount > 0 ? (
          <Pressable
            testID="unlinked-entry-notice"
            accessibilityRole="button"
            accessibilityLabel={`${unlinkedCount} entries have no transaction. Link missing transactions`}
            onPress={() => router.push('/link-missing')}
            style={[styles.unlinkedNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText>{unlinkedCount} entries have no transaction. <AppText weight="semibold" style={{ color: colors.primary }}>Link</AppText></AppText>
          </Pressable>
        ) : null}
        <View testID="transactions-month-row" style={styles.monthRow}>
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
          <WarningBanner>
            No earned income logged this month
          </WarningBanner>
        ) : null}

        {summary.overspend > 0 ? (
          <WarningBanner>
            Spending plus investing is {formatAmount(summary.overspend, 'exact', 1)} more than income this month
          </WarningBanner>
        ) : null}

        <SearchField
          accessibilityLabel="Search transactions"
          placeholder="Search note or category"
          value={query}
          onChangeText={setQuery}
        />

        {visiblePendingItems.length > 0 ? (
          <View testID="pending-items-section" style={styles.pendingSection}>
            <Card style={styles.pendingCard}>
              <View testID="pending-items-header" style={[styles.pendingHeader, { borderBottomColor: colors.border }]}>
                <AppText weight="semibold">
                  {visiblePendingItems.length === 1
                    ? '1 payment due of total '
                    : `${visiblePendingItems.length} payments due of total `}
                  <AmountText value={visiblePendingItems.reduce((total, item) => total + item.amount, 0)} tier="row" weight="semibold" />
                </AppText>
              </View>
              <View testID="pending-items-list" style={styles.pendingList}>
                {visiblePendingItems.map((item, index) => (
                  <PendingItemRow
                    key={item.id}
                    item={item}
                    transactionDue
                    last={index === visiblePendingItems.length - 1}
                    actions={(
                      <PendingItemActions
                        item={item}
                        today={today}
                        compact
                        actionLabel={pendingTransactionType(item) === 'income' ? 'Received' : 'Paid'}
                      />
                    )}
                  />
                ))}
              </View>
            </Card>
          </View>
        ) : null}

        <View testID="transactions-list" style={styles.list}>
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
                const categoryLabel = transactionCategoryLabel(item.category, item.type, budgetCategories);
                return (
                  <ListItem
                    key={item.id}
                    title={item.note || categoryLabel}
                    subtitle={linked ? `${categoryLabel}\n→ ${linked.label}` : categoryLabel}
                    amount={`${tone.symbol}${formatAmount(item.amount, 'row', fontScale)}`}
                    accessibilityLabel={`${item.note || categoryLabel}, ${categoryLabel}, ${tone.symbol}${formatAmount(item.amount, 'exact', 1)}`}
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
  pendingSection: { marginHorizontal: 20, marginTop: 8 },
  pendingCard: { marginHorizontal: 0, marginTop: 0, paddingVertical: 10, paddingHorizontal: 14 },
  pendingHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  pendingList: { paddingTop: 4, gap: 4 },
  dateGroup: { marginTop: 14, marginBottom: 3, fontSize: 11 },
  cashCard: { marginHorizontal: 20, marginTop: 0, minHeight: 56, padding: 12, justifyContent: 'center', gap: 8 },
  unlinkedNotice: { minHeight: 44, marginHorizontal: 20, marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  balanceSummary: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceTitle: { flex: 1, minWidth: 0 },
  balanceLabel: { fontSize: 11 },
  balanceValue: { fontSize: 20 },
  balanceActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  broughtForwardChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4 },
  balanceChipText: { fontSize: 10 },
  balanceDivider: { height: StyleSheet.hairlineWidth },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 1 },
});
