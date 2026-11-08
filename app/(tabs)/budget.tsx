import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { PendingItemActions } from '../../src/components/PendingItemActions';
import { PendingItemRow } from '../../src/components/PendingItemRow';
import { AppText, Button, Card, Screen } from '../../src/components/ui';
import { useAppStore } from '../../src/data/store';
import { useUIStore } from '../../src/data/uiStore';
import { useAppActions, useAppData } from '../../src/data/useAppData';
import { BUDGET_GROUPS, budgetMonthView } from '../../src/domain/budget';
import { normalizeMoney } from '../../src/domain/cashFlow';
import { shiftMonth } from '../../src/domain/dates';
import { budgetGroupRows, type BudgetGroupRow, type PendingItem } from '../../src/domain/pending';
import { transactionCategoryLabel } from '../../src/domain/transactions';
import { formatAmount } from '../../src/lib/amountDisplay';
import { todayISO } from '../../src/lib/clock';
import { confirmAsync } from '../../src/lib/confirm';
import { formatMonth } from '../../src/lib/format';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

const DISPLAY_GROUPS = [
  ...BUDGET_GROUPS.map((group) => ({
    id: group.id,
    name: group.name,
    categories: group.id === 'survival'
      ? group.categories.filter((category) => category !== 'EMI' && category !== 'Insurance')
      : group.categories,
  })),
  { id: 'debt-repayments', name: 'Debt repayments', categories: ['EMI'] },
  { id: 'insurance', name: 'Insurance', categories: ['Insurance'] },
];

function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function asPendingItem(row: BudgetGroupRow): PendingItem {
  return {
    id: row.id,
    kind: row.source.kind === 'budget' ? 'budget' : 'due',
    title: row.title,
    category: row.category,
    amount: row.amount,
    ...(row.dueDate === undefined ? {} : { dueDate: row.dueDate }),
    status: row.status === 'paid' ? 'planned' : row.status,
    source: row.source,
    actionable: row.actionable,
  };
}

function displayTitle(row: BudgetGroupRow): string {
  if (row.automatic) return row.title;
  return transactionCategoryLabel(row.title, row.category === 'Other investments' ? 'invest' : 'expense');
}

export default function BudgetScreen() {
  const params = useLocalSearchParams<{ month?: string; apply?: string }>();
  const routeParam = typeof params.month === 'string' ? params.month : '';
  const routeMonth = isMonthKey(routeParam) ? routeParam : null;
  const routeKey = routeParam;
  const routeApply = params.apply === '1';
  const [routeState, setRouteState] = useState(() => ({
    routeKey,
    month: routeMonth ?? todayISO().slice(0, 7),
  }));
  if (routeState.routeKey !== routeKey) {
    setRouteState(() => ({
      routeKey,
      month: routeMonth ?? todayISO().slice(0, 7),
    }));
  }
  const { month } = routeState;
  const setMonth = (value: string) => setRouteState((current) => ({ ...current, month: value }));
  const [touchingHeader, setTouchingHeader] = useState(false);
  const data = useAppData();
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const today = todayISO();
  const view = useMemo(() => budgetMonthView(data, month), [data, month]);
  const closingBalance = normalizeMoney(view.position.closing);
  const groupRows = useMemo(() => budgetGroupRows(data, month, today), [data, month, today]);
  const stackMetrics = fontScale >= 1.3;
  const autoApplyStarted = useRef(false);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      !touchingHeader && swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx }) !== null,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, gesture) => {
      const intent = swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx });
      if (intent) setMonth(shiftMonth(month, intent === 'next' ? 1 : -1));
    },
  }), [month, touchingHeader]);
  const apply = useCallback(async () => {
    if (!data.budgetPlan) {
      router.push('/budget-setup');
      return;
    }
    const previous = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    if (previous) {
      const confirmed = await confirmAsync({
        title: 'Replace this month’s budget?',
        message: 'Payments already recorded stay.',
        confirmLabel: 'Replace',
      });
      if (!confirmed) return;
    }
    actions.applyBudgetPlan(month);
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not apply budget plan', error);
      return;
    }
    const plannedCount = budgetGroupRows(useAppStore.getState().data, month, today)
      .filter((row) => row.source.kind === 'budget' && row.status !== 'paid').length;
    setActionToast({
      message: `Budget applied: ${plannedCount} planned items are in Transactions as due payments`,
      actionLabel: 'Undo',
      onAction: () => {
        actions.restoreMonthBudget(month, previous);
      },
    });
  }, [actions, data.budgetPlan, data.monthBudgets, month, setActionToast, today]);
  useEffect(() => {
    if (!routeApply || autoApplyStarted.current) return;
    autoApplyStarted.current = true;
    void apply();
  }, [routeApply, apply]);

  return (
    <Screen scroll={false}>
      <View style={styles.gestureSurface} {...panResponder.panHandlers}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader
            title="Budget"
            rightActions={[{ icon: 'edit-2', label: 'Edit budget', onPress: () => router.push('/budget-setup') }]}
            showDefaultMenu={false}
          />
          <View
            onTouchStart={() => setTouchingHeader(true)}
            onTouchEnd={() => setTouchingHeader(false)}
            onTouchCancel={() => setTouchingHeader(false)}
            style={styles.monthHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))}>
              <Feather name="chevron-left" size={22} color={colors.text2} />
            </Pressable>
            <AppText weight="semibold" style={typography.name}>{formatMonth(month)}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(shiftMonth(month, 1))}>
              <Feather name="chevron-right" size={22} color={colors.text2} />
            </Pressable>
          </View>

          <View testID="budget-cash-flow">
            <Card>
            <AppText weight="bold" style={[typography.name, styles.cardTitle]}>Cash flow</AppText>
            <View style={[styles.metricRows, stackMetrics && styles.metricRowsStacked]}>
              <MetricRow label="Opening balance" value={view.position.opening} />
              <MetricRow
                label="Closing balance"
                value={closingBalance}
                tone={closingBalance < 0 ? 'err' : closingBalance > 0 ? 'primary' : 'neutral'}
              />
            </View>
            </Card>
          </View>

          <View testID="budget-plan-summary">
            <Card>
            <AppText weight="bold" style={[typography.name, styles.cardTitle]}>Plan summary</AppText>
            {view.budget ? (
              <>
                <View style={[styles.metricRows, stackMetrics && styles.metricRowsStacked]}>
                  <MetricRow label="Planned income" value={view.plannedIncome} />
                  <MetricRow label="Planned spending" value={view.plannedSpend} />
                  <MetricRow label="Planned saving" value={view.plannedSave} />
                  <MetricRow label="Left to allocate" value={view.unallocated} />
                  {view.income.bySource.length > 0
                    ? <MetricRow label="Actual income" value={view.income.actual} />
                    : null}
                </View>
                <Button
                  label="Adjust this month"
                  onPress={() => router.push({ pathname: '/budget-month-form', params: { month } })}
                />
              </>
            ) : (
              <>
                <AppText style={[typography.meta, { color: colors.text3 }]}>No budget for this month</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {data.budgetPlan ? 'Apply your plan to see this month’s budget.' : 'Set up a plan to start budgeting.'}
                </AppText>
                <Button
                  label={data.budgetPlan ? 'Apply budget' : 'Set up budget'}
                  icon={data.budgetPlan ? 'check' : 'plus'}
                  variant="primary"
                  onPress={() => {
                    if (data.budgetPlan) void apply();
                    else router.push('/budget-setup');
                  }}
                />
              </>
            )}
            </Card>
          </View>

          {DISPLAY_GROUPS.map((group) => {
            const rows = groupRows.filter((row) => group.categories.includes(row.category));
            const planned = rows.reduce((sum, row) => sum + row.plannedAmount, 0);
            const actual = rows.reduce((sum, row) => sum + row.actualAmount, 0);
            return (
              <View key={group.id} testID={`budget-group-${group.id}`}>
                <Card style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <AppText weight="bold" style={[typography.name, styles.groupTitle]}>{group.name}</AppText>
                    <AppText
                      weight="semibold"
                      style={typography.meta}
                      accessibilityLabel={`${group.name}: actual ${formatAmount(actual, 'exact', 1)} of planned ${formatAmount(planned, 'exact', 1)}`}>
                      <AmountText value={actual} tier="row" /> / <AmountText value={planned} tier="row" />
                    </AppText>
                  </View>
                  {rows.length > 0 ? rows.map((row) => {
                    const pendingItem = asPendingItem(row);
                    return (
                      <PendingItemRow
                        key={row.id}
                        item={{ ...pendingItem, title: displayTitle(row) }}
                        actualAmount={row.actualAmount}
                        plannedAmount={row.plannedAmount}
                        automatic={row.automatic}
                        statusOverride={row.status === 'paid' ? 'paid' : undefined}
                        showDuePrefix
                        actions={row.status === 'paid'
                          ? undefined
                          : <PendingItemActions item={pendingItem} today={today} compact />}
                      />
                    );
                  }) : (
                    <AppText style={[typography.meta, { color: colors.text3 }]}>No items this month</AppText>
                  )}
                </Card>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Screen>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone?: 'err' | 'primary' | 'neutral';
}) {
  return (
    <View style={styles.metricRow}>
      <AppText style={typography.meta}>{label}</AppText>
      {value === null
        ? <AppText weight="semibold">—</AppText>
        : <AmountText value={value} tier="row" weight="semibold" tone={tone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  content: { paddingBottom: 28, gap: 10 },
  monthHeader: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  cardTitle: { marginBottom: 8 },
  metricRows: { gap: 8 },
  metricRowsStacked: { gap: 12 },
  metricRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  groupCard: { gap: 0, paddingVertical: 0 },
  groupHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  groupTitle: { flex: 1, minWidth: 0 },
});
