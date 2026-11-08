import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { CardHeaderRow } from '../../src/components/CardHeaderRow';
import { PendingItemActions } from '../../src/components/PendingItemActions';
import { PendingItemRow } from '../../src/components/PendingItemRow';
import { SortChip } from '../../src/components/SortChip';
import { AppText, Button, Card, ChipRow, ProgressBar, Screen, SectionTitle } from '../../src/components/ui';
import { useAppStore } from '../../src/data/store';
import { useUIStore } from '../../src/data/uiStore';
import { useAppActions, useAppData } from '../../src/data/useAppData';
import { useSort } from '../../src/data/useSort';
import { BUDGET_GROUPS, budgetMonthView } from '../../src/domain/budget';
import { normalizeMoney } from '../../src/domain/cashFlow';
import { shiftMonth } from '../../src/domain/dates';
import { pendingItems } from '../../src/domain/pending';
import { transactionCategoryLabel } from '../../src/domain/transactions';
import { formatAmount } from '../../src/lib/amountDisplay';
import { todayISO } from '../../src/lib/clock';
import { confirmAsync } from '../../src/lib/confirm';
import { formatMonth } from '../../src/lib/format';
import { SORT_OPTIONS } from '../../src/lib/sorting';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function BudgetScreen() {
  const params = useLocalSearchParams<{ month?: string; apply?: string }>();
  const routeMonth = typeof params.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month)
    ? params.month : null;
  const routeApply = params.apply === '1';
  const routeKey = routeMonth ?? '';
  const [routeState, setRouteState] = useState(() => ({
    routeKey,
    month: routeMonth ?? todayISO().slice(0, 7),
  }));
  if (routeState.routeKey !== routeKey) {
    setRouteState((current) => ({
      routeKey,
      month: routeMonth ?? current.month,
    }));
  }
  const { month } = routeState;
  const setMonth = (value: string) => setRouteState((current) => ({ ...current, month: value }));
  const [touchingHeader, setTouchingHeader] = useState(false);
  const [incomeSourcesOpen, setIncomeSourcesOpen] = useState(false);
  const data = useAppData();
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const { colors } = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const sorting = useSort('budgetSpending');
  const today = todayISO();
  const view = useMemo(() => budgetMonthView(data, month), [data, month]);
  const closingBalance = normalizeMoney(view.position.closing);
  const monthPendingItems = useMemo(
    () => pendingItems(data, month, today),
    [data, month, today],
  );
  const stackMetrics = width < 360 || fontScale >= 1.8;
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
    const plannedCount = pendingItems(useAppStore.getState().data, month, today)
      .filter((item) => item.kind === 'budget').length;
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

  const lines = sorting.sort(view.lines);
  return (
    <Screen scroll={false}>
      <View style={styles.gestureSurface} {...panResponder.panHandlers}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Budget" showDefaultMenu={false} />
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
          <Card>
            <AppText weight="bold" style={[typography.name, styles.cashFlowTitle]}>Cash flow</AppText>
            <View style={[styles.cashFlowMetrics, stackMetrics && styles.cashFlowMetricsStacked]}>
              <CashFlowMetric label="Opening balance" value={view.position.opening} />
              <CashFlowMetric
                label="This month’s flow"
                value={view.position.flow}
                negativeStatus="Net outflow"
                positiveStatus="Net inflow"
              />
            </View>
            <View style={[styles.previousPosition, stackMetrics && styles.previousPositionStacked, { borderTopColor: colors.border }]}>
              <View style={styles.previousPositionText}>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Previous month {view.position.previousClosing < 0
                    ? 'deficit'
                    : view.position.previousClosing > 0 ? 'surplus' : 'balanced'}
                </AppText>
                <AmountText
                  value={Math.abs(view.position.previousClosing)}
                  tier="row"
                  weight="semibold"
                  tone={view.position.previousClosing < 0 ? 'err' : 'neutral'}
                />
              </View>
              <Button
                label="Review"
                icon="arrow-right"
                accessibilityHint="Opens the previous month review"
                onPress={() => router.push({ pathname: '/month-review', params: { month: shiftMonth(month, -1) } })}
                style={[styles.reviewButton, stackMetrics && styles.reviewButtonStacked]}
              />
            </View>
            <View style={[styles.closingPosition, stackMetrics && styles.closingPositionStacked, { borderTopColor: colors.border }]}>
              <View style={styles.closingPositionLabel}>
                <AppText weight="semibold">Closing balance</AppText>
                {closingBalance < 0 ? (
                  <AppText style={[typography.meta, { color: colors.err }]}>Deficit</AppText>
                ) : null}
              </View>
              <AmountText
                value={closingBalance}
                tier="tile"
                weight="bold"
                tone={closingBalance < 0 ? 'err' : closingBalance > 0 ? 'primary' : 'neutral'}
                style={styles.closingAmount}
              />
            </View>
          </Card>

          {!view.budget ? (
            <View testID="budget-no-plan-card">
              <Card style={styles.noBudgetCard}>
                <AppText weight="bold" style={typography.name}>No budget for this month</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Set up one plan for this month. Recurring items appear automatically.
                </AppText>
                <Button
                  label={data.budgetPlan ? 'Apply budget' : 'Set up budget'}
                  icon={data.budgetPlan ? 'check' : 'plus'}
                  variant="primary"
                  onPress={() => {
                    if (data.budgetPlan) void apply();
                    else router.push('/budget-setup');
                  }}
                  style={styles.fullWidthButton}
                />
              </Card>
            </View>
          ) : (
            <Card>
              <CardHeaderRow
                title={<AppText weight="semibold">Plan summary</AppText>}
                editLabel="Edit budget plan"
                onEdit={() => router.push('/budget-setup')}
              />
              <View>
                <View style={[styles.planMetrics, stackMetrics && styles.planMetricsStacked]}>
                  <PlanMetric label="Planned income" value={view.plannedIncome} />
                  <PlanMetric label="Planned spending" value={view.plannedSpend} />
                  <PlanMetric label="Planned savings" value={view.plannedSave} />
                  <PlanMetric label="Unallocated" value={view.unallocated} />
                </View>
                <Button label="Adjust this month" onPress={() => router.push({ pathname: '/budget-month-form', params: { month } })} />
              </View>
            </Card>
          )}

          <Card>
            <Pressable
              testID="budget-income-summary"
              accessibilityRole="button"
              accessibilityLabel={`Income planned ${view.income.planned === null ? 'unavailable' : formatAmount(view.income.planned, 'exact', 1)}, actual ${formatAmount(view.income.actual, 'exact', 1)}`}
              accessibilityState={{ expanded: incomeSourcesOpen }}
              onPress={() => setIncomeSourcesOpen((expanded) => !expanded)}
              style={styles.incomeSummary}>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold">Income planned versus actual</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {view.income.planned === null ? 'Planned income not set' : `Planned ${formatAmount(view.income.planned, 'exact', 1)}`}
                  {' · '}Actual {formatAmount(view.income.actual, 'exact', 1)}
                </AppText>
              </View>
              <AppText style={[typography.meta, { color: colors.primary }]}>
                {incomeSourcesOpen ? 'Hide sources' : 'Show sources'}
              </AppText>
            </Pressable>
            {incomeSourcesOpen ? (
              <View style={styles.incomeSources}>
                {view.income.bySource.map(({ category, amount }) => (
                  <BudgetStat key={category} label={category} value={amount} />
                ))}
                {view.income.bySource.length === 0 ? <AppText>No earned income recorded.</AppText> : null}
                {view.income.extra > 0 ? <BudgetStat label="Income above plan" value={view.income.extra} /> : null}
              </View>
            ) : null}
            {view.otherMoneyIn > 0 ? (
              <BudgetStat label="Other money in (not income)" value={view.otherMoneyIn} />
            ) : null}
          </Card>

          <View testID="budget-bills-section">
            <View testID="budget-bills-header" style={styles.billsHeader}>
              <AppText weight="bold" style={[typography.name, styles.billsTitle]}>Bills and dues</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]} accessibilityLabel={`${monthPendingItems.length} due, ${formatAmount(monthPendingItems.reduce((sum, item) => sum + item.amount, 0), 'exact', 1)}`}>
                {monthPendingItems.length} due · <AmountText value={monthPendingItems.reduce((sum, item) => sum + item.amount, 0)} tier="row" />
              </AppText>
            </View>
            <View testID="budget-bills-list">
              {monthPendingItems.length ? (
                <Card style={styles.billsCard}>
                  {monthPendingItems.map((item) => (
                    <PendingItemRow
                      key={item.id}
                      item={item}
                      actions={<PendingItemActions item={item} today={today} />}
                    />
                  ))}
                </Card>
              ) : (
                <Card><AppText style={{ color: colors.text3 }}>No bills due this month</AppText></Card>
              )}
            </View>
          </View>
          <Card>
            <AppText style={typography.meta}>Reminders are off · <AppText weight="semibold">Manage reminders</AppText></AppText>
          </Card>

          {view.budget ? (
            <>
              <ChipRow>
                <SortChip options={SORT_OPTIONS.budgetSpending} spec={sorting.spec} onChange={sorting.setSpec} />
              </ChipRow>
              {BUDGET_GROUPS.map((group) => {
                const groupLines = lines.filter((line) => group.categories.includes(line.category));
                const plannedSubtotal = groupLines.reduce((sum, line) => sum + line.planned, 0);
                const unbudgeted = view.unbudgetedByGroup.find((row) => row.groupId === group.id)?.amount ?? 0;
                const actualSubtotal = groupLines.reduce((sum, line) => sum + line.actual, 0) + unbudgeted;
                const plannedPercent = view.plannedIncome && view.plannedIncome > 0
                  ? plannedSubtotal / view.plannedIncome * 100 : 0;
                return (
                  <View key={group.id} testID={`budget-spending-group-${group.id}`}>
                    <SectionTitle>{group.name}</SectionTitle>
                    <Card style={{ gap: 8 }}>
                      <AppText style={[typography.meta, { color: colors.text3 }]}>{group.hint}</AppText>
                      <AppText
                        weight="semibold"
                        accessibilityLabel={`${group.name} planned subtotal ${formatAmount(plannedSubtotal, 'exact', 1)}, ${plannedPercent.toFixed(1)}% of planned income`}>
                        Planned {formatAmount(plannedSubtotal, 'exact', 1)} · {plannedPercent.toFixed(1)}% of income
                      </AppText>
                      <AppText style={typography.meta}>Actual {formatAmount(actualSubtotal, 'exact', 1)}</AppText>
                      {groupLines.map((line) => (
                        <View key={line.category} style={{ gap: 6 }}>
                          <BudgetLineCard
                            category={line.category}
                            planned={line.planned}
                            actual={line.actual}
                            usedPct={line.usedPct}
                            status={line.status}
                            month={month}
                          />
                          {(view.linkedByCategory ?? []).find((entry) => entry.category === line.category)?.rows.map((row) => (
                            <View key={row.id} style={styles.linkedBudgetRow}>
                              <View style={{ flex: 1 }}>
                                <AppText weight="semibold">{row.name}</AppText>
                                <AppText style={[typography.meta, { color: colors.text3 }]}>{row.dueDate}</AppText>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <AppText>Auto</AppText>
                                <AmountText value={row.amount} tier="row" />
                              </View>
                            </View>
                          ))}
                        </View>
                      ))}
                      {unbudgeted > 0 ? <BudgetStat label="Unbudgeted" value={unbudgeted} /> : null}
                    </Card>
                  </View>
                );
              })}
              <SectionTitle>Debt repayments</SectionTitle>
              <Card>
                <BudgetStat label="EMIs planned" value={view.debt.emiPlanned} />
                <BudgetStat label="EMIs paid" value={view.debt.emiActual} />
                <BudgetStat label="Prepayments" value={view.debt.prepaymentsActual} />
              </Card>
              <SectionTitle>Insurance</SectionTitle>
              <Card>
                <BudgetStat label="Premiums planned" value={view.commitments.filter((row) => row.kind === 'policy').reduce((sum, row) => sum + row.plannedAmount, 0)} />
                <BudgetStat label="Premiums paid" value={view.commitments.filter((row) => row.kind === 'policy').reduce((sum, row) => sum + row.paidAmount, 0)} />
              </Card>
              <SectionTitle>Outstanding at month end</SectionTitle>
              <Card><BudgetStat label={`${view.outstanding.count} overdue dues`} value={view.outstanding.amount} /></Card>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

function CashFlowMetric({
  label,
  value,
  negativeStatus = 'Deficit',
  positiveStatus,
}: {
  label: string;
  value: number;
  negativeStatus?: string;
  positiveStatus?: string;
}) {
  const { colors } = useTheme();
  const status = value < 0 ? negativeStatus : value > 0 ? positiveStatus : undefined;
  return (
    <View style={styles.cashFlowMetric}>
      <AppText style={[typography.meta, { color: colors.text3 }]}>{label}</AppText>
      <AmountText value={value} tier="tile" weight="semibold" tone={value < 0 ? 'err' : 'neutral'} />
      {status ? (
        <AppText style={[typography.meta, { color: value < 0 ? colors.err : colors.text3 }]}>{status}</AppText>
      ) : null}
    </View>
  );
}

function PlanMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.planMetric}>
      <AppText style={typography.meta}>{label}</AppText>
      {value === null
        ? <AppText weight="semibold">—</AppText>
        : <AmountText value={value} tier="row" weight="semibold" />}
    </View>
  );
}

function BudgetStat({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.statRow}>
      <AppText>{label}</AppText>
      <AppText
        weight={bold ? 'bold' : 'medium'}
        accessibilityLabel={`${label}, ${formatAmount(value, 'exact', 1)}`}>
        <AmountText value={value} tier="row" weight={bold ? 'bold' : 'medium'} />
      </AppText>
    </View>
  );
}

function BudgetLineCard({
  category, planned, actual, usedPct, status, month,
}: {
  category: string; planned: number; actual: number; usedPct: number | null;
  status: 'ok' | 'near' | 'over'; month: string;
}) {
  const { colors } = useTheme();
  const displayCategory = transactionCategoryLabel(category, category === 'Other investments' ? 'invest' : 'expense');
  const tone = status === 'over' ? colors.err : status === 'near' ? colors.primary : colors.ok;
  const progressTone = status === 'over' ? 'err' : status === 'near' ? 'primary' : 'ok';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${displayCategory}: ${formatAmount(actual, 'exact', 1)} of ${formatAmount(planned, 'exact', 1)}`}
      onPress={() => router.push({
        pathname: '/(tabs)/transactions',
        params: { month, category },
      })}
      style={[styles.lineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.lineTop}>
        <AppText weight="semibold">{displayCategory}</AppText>
        <AppText
          style={[typography.meta, { color: tone }]}
          accessibilityLabel={`${formatAmount(actual, 'exact', 1)} of ${formatAmount(planned, 'exact', 1)}`}>
          <AmountText value={actual} tier="row" /> / <AmountText value={planned} tier="row" />
        </AppText>
      </View>
      <ProgressBar percent={usedPct ?? 0} tone={progressTone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  content: { paddingBottom: 28, gap: 10 },
  monthHeader: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  incomeSummary: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  incomeSources: { paddingTop: 8, gap: 6 },
  cashFlowTitle: { marginBottom: 10 },
  cashFlowMetrics: { flexDirection: 'row', gap: 14 },
  cashFlowMetricsStacked: { flexDirection: 'column' },
  cashFlowMetric: { flex: 1, minWidth: 0, gap: 4 },
  previousPosition: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previousPositionStacked: { alignItems: 'stretch', flexDirection: 'column' },
  previousPositionText: { flex: 1, minWidth: 0, gap: 3 },
  reviewButton: { flexGrow: 0, minWidth: 82 },
  reviewButtonStacked: { alignSelf: 'stretch' },
  noBudgetCard: { gap: 12 },
  fullWidthButton: { alignSelf: 'stretch' },
  billsHeader: { marginHorizontal: 20, marginTop: 18, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  billsTitle: { flex: 1 },
  billsCard: { gap: 0, paddingVertical: 0 },
  closingPosition: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  closingPositionLabel: { flex: 1, minWidth: 0, gap: 3 },
  closingPositionStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  closingAmount: { fontSize: 18 },
  planMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  planMetricsStacked: { flexDirection: 'column' },
  planMetric: { flexBasis: '45%', flexGrow: 1, minWidth: 0, gap: 4 },
  statRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  lineCard: { marginHorizontal: 20, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, gap: 10 },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  linkedBudgetRow: { marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
