import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { PaceLine, SectionBars, StackedBar } from '../../src/components/BudgetCharts';
import { BudgetItemEditSheet } from '../../src/components/BudgetItemEditSheet';
import { AppText, Button, Card, Screen } from '../../src/components/ui';
import { useAppStore } from '../../src/data/store';
import { useUIStore } from '../../src/data/uiStore';
import { useAppActions, useAppData } from '../../src/data/useAppData';
import { budgetOverview, effectiveMonthBudget, type BudgetOverviewItem } from '../../src/domain/budget';
import { shiftMonth } from '../../src/domain/dates';
import { pendingItems } from '../../src/domain/pending';
import { todayISO } from '../../src/lib/clock';
import { confirmAsync } from '../../src/lib/confirm';
import { formatAmount } from '../../src/lib/amountDisplay';
import { formatMonth } from '../../src/lib/format';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
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
  const [editingItem, setEditingItem] = useState<BudgetOverviewItem | null>(null);
  const data = useAppData();
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const today = todayISO();
  const overview = useMemo(() => budgetOverview(data, month, today), [data, month, today]);
  const currentMonth = today.slice(0, 7);
  const lastAllowedMonth = shiftMonth(currentMonth, 24);
  const nextDisabled = month >= lastAllowedMonth;
  const stackMetrics = fontScale >= 1.3;
  const autoApplyStarted = useRef(false);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      !touchingHeader && swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx }) !== null,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, gesture) => {
      const intent = swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx });
      if (!intent) return;
      const target = shiftMonth(month, intent === 'next' ? 1 : -1);
      if (intent === 'next' && target > lastAllowedMonth) return;
      setMonth(target);
    },
  }), [lastAllowedMonth, month, touchingHeader]);

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
      .filter((item) => item.source.kind === 'budget').length;
    setActionToast({
      message: `Budget applied: ${plannedCount} planned items are in Transactions as due payments`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreMonthBudget(month, previous),
    });
  }, [actions, data.budgetPlan, data.monthBudgets, month, setActionToast, today]);

  useEffect(() => {
    if (!routeApply || autoApplyStarted.current) return;
    autoApplyStarted.current = true;
    void apply();
  }, [routeApply, apply]);

  const editBudgetItem = (item: BudgetOverviewItem) => {
    switch (item.source.kind) {
      case 'line':
      case 'income':
        if (item.editable) setEditingItem(item);
        return;
      case 'plan':
        router.push({ pathname: '/investment-form', params: { id: item.source.parentId } });
        return;
      case 'liability':
        router.push({ pathname: '/liability-form', params: { id: item.source.parentId } });
        return;
      case 'policy':
        router.push({ pathname: '/policy-form', params: { id: item.source.parentId } });
    }
  };

  const saveBudgetItem = (item: BudgetOverviewItem, values: {
    amount: number;
    day?: number;
    scope: 'month' | 'following';
  }) => {
    if (item.source.kind !== 'line' && item.source.kind !== 'income') return false;
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    actions.editBudgetItem(
      month,
      item.source,
      { amount: values.amount, ...(values.day === undefined ? {} : { dueDay: values.day }) },
      values.scope,
      today,
    );
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not update budget item', error);
      return false;
    }
    setActionToast({
      message: `${item.title} updated`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    return true;
  };

  const removeBudgetItem = (item: BudgetOverviewItem, scope: 'month' | 'following') => {
    if (item.source.kind !== 'line' && item.source.kind !== 'income') return false;
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    actions.removeBudgetItem(month, item.source, scope, today);
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not remove budget item', error);
      return false;
    }
    setActionToast({
      message: `${item.title} removed`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    return true;
  };

  const editingBudget = editingItem
    ? effectiveMonthBudget(data, month, today).budget
    : null;
  const editingSource = editingItem?.source;
  const editingDay = editingSource?.kind === 'line'
    ? editingBudget?.items.find((item) => item.name === editingSource.category)?.dueDay
    : editingSource?.kind === 'income'
      ? editingBudget?.incomes.find((income) => income.id === editingSource.incomeId)?.day
      : undefined;
  const laterCustomMonths = (data.monthBudgets ?? [])
    .filter((budget) => budget.month > month && budget.source === 'custom').length;

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => setMonth(shiftMonth(month, -1))}>
              <Feather name="chevron-left" size={22} color={colors.text2} />
            </Pressable>
            <AppText weight="semibold" style={typography.name}>{formatMonth(month)}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              accessibilityState={{ disabled: nextDisabled }}
              disabled={nextDisabled}
              onPress={() => setMonth(shiftMonth(month, 1))}
              style={nextDisabled && styles.disabled}>
              <Feather name="chevron-right" size={22} color={colors.text2} />
            </Pressable>
          </View>

          <View testID="budget-cash-flow">
            <Card>
              <AppText weight="bold" style={[typography.name, styles.cardTitle]}>Cash flow</AppText>
              <View style={[styles.metricRows, stackMetrics && styles.metricRowsStacked]}>
                <MetricRow
                  label={overview.cashFlow.projected ? 'Projected opening balance' : 'Opening balance'}
                  value={overview.cashFlow.opening}
                />
                <MetricRow
                  label={overview.cashFlow.projected ? 'Projected closing balance' : 'Closing balance'}
                  value={overview.cashFlow.closing}
                  tone={overview.cashFlow.closing < 0 ? 'err' : overview.cashFlow.closing > 0 ? 'primary' : 'neutral'}
                />
              </View>
            </Card>
          </View>

          {overview.sections.length === 0 ? (
            <View testID="budget-empty-state">
              <Card>
                <AppText weight="bold" style={[typography.name, styles.cardTitle]}>
                  {overview.mode === 'future' && data.budgetPlan ? 'Not planned' : 'No budget for this month'}
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {overview.mode === 'future' && data.budgetPlan
                    ? 'This future month has no budget snapshot.'
                    : 'Set up a budget to start planning this month.'}
                </AppText>
                <Button
                  label={overview.mode === 'future' && data.budgetPlan
                    ? `Apply plan to ${formatMonth(month)}`
                    : 'Set up budget'}
                  icon={overview.mode === 'future' && data.budgetPlan ? 'check' : 'plus'}
                  variant="primary"
                  onPress={() => {
                    if (overview.mode === 'future' && data.budgetPlan) void apply();
                    else router.push('/budget-setup');
                  }}
                />
              </Card>
            </View>
          ) : (
            <>
              <View testID="budget-overview-card">
                <Card>
                  <AppText weight="bold" style={[typography.name, styles.cardTitle]}>Overview</AppText>
                  <StackedBar values={overview.stacked} summary={overview.summary.stacked} />
                  <View style={styles.metricRows}>
                    <OverviewMetricRow label="Income" planned={overview.stacked.income.planned} actual={overview.stacked.income.actual} stacked={stackMetrics} />
                    <OverviewMetricRow label="Spending" planned={overview.stacked.spend.planned} actual={overview.stacked.spend.actual} stacked={stackMetrics} />
                    <OverviewMetricRow label="Investing" planned={overview.stacked.invest.planned} actual={overview.stacked.invest.actual} stacked={stackMetrics} />
                    <OverviewMetricRow label="Left" planned={overview.stacked.left.planned} actual={overview.stacked.left.actual} stacked={stackMetrics} />
                  </View>
                </Card>
              </View>

              <View testID="budget-planned-vs-actual">
                <Card>
                  <AppText weight="bold" style={[typography.name, styles.cardTitle]}>Planned vs actual</AppText>
                  <SectionBars sections={overview.sections} summary={overview.summary.sections} />
                </Card>
              </View>

              {overview.pace ? (
                <View testID="budget-pace">
                  <Card>
                    <AppText weight="bold" style={[typography.name, styles.cardTitle]}>Pace</AppText>
                    <PaceLine pace={overview.pace} summary={overview.summary.pace ?? ''} />
                  </Card>
                </View>
              ) : null}

              {overview.sections.map((section) => (
                <View key={section.id} testID={`budget-section-${section.id}`}>
                  <Card style={styles.sectionCard}>
                    <AppText weight="bold" style={[typography.name, styles.sectionTitle]}>{section.name}</AppText>
                    {section.items.map((item, index) => (
                      <View
                        key={item.id}
                        testID={`budget-row-${item.id}`}
                        style={[
                          styles.overviewRow,
                          stackMetrics && styles.overviewRowStacked,
                          index < section.items.length - 1
                            ? [styles.rowDivider, { borderBottomColor: colors.border }]
                            : undefined,
                        ]}>
                        <AppText style={[typography.meta, styles.rowTitle]}>{item.title}</AppText>
                        <View style={styles.rowValueAndAction}>
                          <AppText
                            style={typography.meta}
                            accessibilityLabel={`${item.title}, ${formatAmount(item.actual, 'exact', 1)} of ${formatAmount(item.planned, 'exact', 1)}`}>
                            <AmountText value={item.actual} tier="row" /> / <AmountText value={item.planned} tier="row" />
                          </AppText>
                          {overview.mode !== 'past' && (item.kind === 'linked' || item.editable) ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Edit ${item.title}`}
                              onPress={() => editBudgetItem(item)}
                              style={styles.editButton}>
                              <Feather name="edit-2" size={16} color={colors.primary} />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </Card>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        {editingItem && overview.mode !== 'past'
          && (editingItem.source.kind === 'line' || editingItem.source.kind === 'income') ? (
            <BudgetItemEditSheet
              key={editingItem.id}
              visible
              title={editingItem.title}
              amount={editingItem.planned}
              day={editingDay}
              incomeDetails={editingItem.source.kind === 'income'
                ? { name: editingItem.title, category: editingItem.source.category }
                : undefined}
              laterCustomMonths={laterCustomMonths}
              onClose={() => setEditingItem(null)}
              onSave={(values) => saveBudgetItem(editingItem, values)}
              onRemove={(scope) => removeBudgetItem(editingItem, scope)}
            />
          )
          : null}
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
  value: number;
  tone?: 'err' | 'primary' | 'neutral';
}) {
  return (
    <View style={styles.metricRow}>
      <AppText accessibilityLabel={label} style={typography.meta}>{label}</AppText>
      <AmountText value={value} tier="row" weight="semibold" tone={tone} />
    </View>
  );
}

function OverviewMetricRow({
  label,
  planned,
  actual,
  stacked,
}: {
  label: string;
  planned: number;
  actual: number;
  stacked: boolean;
}) {
  return (
    <View style={[styles.overviewMetricRow, stacked && styles.overviewMetricRowStacked]}>
      <AppText style={typography.meta}>{label}</AppText>
      <View style={[styles.overviewMetricValues, stacked && styles.overviewMetricValuesStacked]}>
        <View style={styles.metricValue}>
          <AppText style={styles.valueLabel}>Planned</AppText>
          <AmountText value={planned} tier="row" weight="semibold" />
        </View>
        <View style={styles.metricValue}>
          <AppText style={styles.valueLabel}>Actual</AppText>
          <AmountText value={actual} tier="row" weight="semibold" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  content: { paddingBottom: 28, gap: 10 },
  monthHeader: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  disabled: { opacity: 0.45 },
  cardTitle: { marginBottom: 8 },
  metricRows: { gap: 8 },
  metricRowsStacked: { gap: 12 },
  metricRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  overviewMetricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  overviewMetricRowStacked: { alignItems: 'stretch', flexDirection: 'column' },
  overviewMetricValues: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' },
  overviewMetricValuesStacked: { justifyContent: 'space-between' },
  metricValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueLabel: { ...typography.label },
  sectionCard: { paddingVertical: 12, gap: 0 },
  sectionTitle: { paddingHorizontal: 4, paddingBottom: 8 },
  overviewRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 4, paddingVertical: 6 },
  overviewRowStacked: { alignItems: 'stretch', flexDirection: 'column' },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { flex: 1, minWidth: 0 },
  rowValueAndAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  editButton: { width: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
});
