import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { PaceLine } from '../../src/components/BudgetCharts';
import { AppText, Button, Card, Screen } from '../../src/components/ui';
import { useAppStore } from '../../src/data/store';
import { useUIStore } from '../../src/data/uiStore';
import { useAppActions, useAppData } from '../../src/data/useAppData';
import {
  budgetOverview,
  createDefaultBudgetPlan,
  defaultBudgetSectionIdFor,
  effectiveMonthBudget,
} from '../../src/domain/budget';
import { shiftMonth } from '../../src/domain/dates';
import { pendingItems } from '../../src/domain/pending';
import { formatAmount } from '../../src/lib/amountDisplay';
import { todayISO } from '../../src/lib/clock';
import { confirmAsync } from '../../src/lib/confirm';
import { formatDate, formatMonth } from '../../src/lib/format';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

const budgetFrequencyLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-yearly',
  yearly: 'Yearly',
} as const;

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
  const [recurringIncomeExpanded, setRecurringIncomeExpanded] = useState(false);
  const data = useAppData();
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const today = todayISO();
  const overview = useMemo(() => budgetOverview(data, month, today), [data, month, today]);
  const overviewAccessibility = [
    `Income ${formatAmount(overview.stacked.income.actual, 'exact', 1)} actual and ${formatAmount(overview.stacked.income.planned, 'exact', 1)} planned`,
    `Spending ${formatAmount(overview.stacked.spend.actual, 'exact', 1)} actual and ${formatAmount(overview.stacked.spend.planned, 'exact', 1)} planned`,
    `Investing ${formatAmount(overview.stacked.invest.actual, 'exact', 1)} actual and ${formatAmount(overview.stacked.invest.planned, 'exact', 1)} planned`,
    `Left ${formatAmount(overview.stacked.left.actual, 'exact', 1)} actual and ${formatAmount(overview.stacked.left.planned, 'exact', 1)} planned`,
  ].join('; ') + [
    overview.stacked.left.actual < 0
      ? ` Actual over by ${formatAmount(Math.abs(overview.stacked.left.actual), 'exact', 1)}.`
      : '',
    overview.stacked.left.planned < 0
      ? ` Planned over by ${formatAmount(Math.abs(overview.stacked.left.planned), 'exact', 1)}.`
      : '',
  ].join('');
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

  const createBudget = useCallback(() => {
    const currentMonthKey = today.slice(0, 7);
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === currentMonthKey) ?? null;
    actions.saveAndApplyBudgetPlan(createDefaultBudgetPlan(currentMonthKey), currentMonthKey);
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not create budget', error);
      return;
    }
    setActionToast({
      message: 'Budget created',
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(null, currentMonthKey, previousMonth),
    });
  }, [actions, data.monthBudgets, setActionToast, today]);

  const apply = useCallback(async () => {
    if (!data.budgetPlan) {
      createBudget();
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
  }, [actions, createBudget, data.budgetPlan, data.monthBudgets, month, setActionToast, today]);

  useEffect(() => {
    if (!routeApply || autoApplyStarted.current) return;
    autoApplyStarted.current = true;
    void apply();
  }, [routeApply, apply]);

  const scopeFor = (adding: boolean): 'month' | 'following' => (
    !adding && overview.mode === 'current'
      && data.monthBudgets?.some((budget) => budget.month === month)
      ? 'month'
      : 'following'
  );

  const openBudgetItem = (
    item: (typeof overview.sections)[number]['items'][number],
    sectionId: string,
  ) => {
    switch (item.source.kind) {
      case 'line': {
        const category = item.source.category;
        const budget = effectiveMonthBudget(data, month, today).budget;
        const budgetItem = budget?.items.find((candidate) => candidate.name === category);
        if (!budgetItem) {
          const targetSectionId = budget?.sections.some((section) => section.id === sectionId)
            ? sectionId
            : defaultBudgetSectionIdFor(category);
          router.push({
            pathname: '/budget-item-form',
            params: { month, sectionId: targetSectionId, name: item.title, scope: scopeFor(true) },
          });
          return;
        }
        router.push({
          pathname: '/budget-item-form',
          params: { month, sectionId: budgetItem.sectionId, itemId: budgetItem.id, scope: scopeFor(false) },
        });
        return;
      }
      case 'income':
        if (!item.editable && !item.source.incomeId.startsWith('actual:')) return;
        if (item.source.incomeId.startsWith('actual:')) {
          router.push({
            pathname: '/budget-income-form',
            params: {
              month,
              name: item.title,
              category: item.source.category,
              amount: String(item.actual),
              scope: scopeFor(true),
            },
          });
          return;
        }
        router.push({
          pathname: '/budget-income-form',
          params: { month, incomeId: item.source.incomeId, scope: scopeFor(false) },
        });
        return;
      case 'other-income':
        return;
      case 'plan':
        router.push({ pathname: '/investment-form', params: { id: item.source.parentId } });
        return;
      case 'liability':
        router.push({ pathname: '/liability-form', params: { id: item.source.parentId } });
        return;
      case 'policy':
        return;
    }
  };

  const confirmDeleteSection = (sectionId: string, sectionName: string) => {
    const itemCount = effectiveMonthBudget(data, month, today).budget?.items
      .filter((item) => item.sectionId === sectionId).length ?? 0;
    Alert.alert(
      'Delete section?',
      `Delete ${sectionName} and its ${itemCount} ${itemCount === 1 ? 'item' : 'items'}? Transactions will remain unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(['month', 'following'] as const).map((scope) => ({
          text: scope === 'month' ? 'This month only' : 'This and following months',
          style: scope === 'following' ? 'destructive' as const : 'default' as const,
          onPress: () => {
            const previousPlan = data.budgetPlan;
            const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
            actions.deleteSection(month, sectionId, scope, today);
            const error = useAppStore.getState().lastError;
            if (error) {
              Alert.alert('Could not delete section', error);
              return;
            }
            setActionToast({
              message: `${sectionName} deleted`,
              actionLabel: 'Undo',
              onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
            });
          },
        })),
      ],
    );
  };

  const activeBudget = effectiveMonthBudget(data, month, today).budget;

  return (
    <Screen scroll={false}>
      <View style={styles.gestureSurface} {...panResponder.panHandlers}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader
            title="Budget"
            rightActions={overview.mode === 'past'
              ? []
              : [{
                icon: 'plus',
                label: 'Add category',
                onPress: () => router.push({
                  pathname: '/budget-section-form',
                  params: { month, type: 'spend', scope: scopeFor(true) },
                }),
              }]}
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
            {month !== currentMonth ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go to current month"
                onPress={() => {
                  setMonth(currentMonth);
                  router.replace({ pathname: '/(tabs)/budget', params: { month: currentMonth } });
                }}
                style={[styles.todayButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText weight="semibold">Today</AppText>
              </Pressable>
            ) : null}
          </View>

          <View testID="budget-cash-flow">
            <Card style={styles.screenCard}>
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
              <Card style={styles.screenCard}>
                <AppText weight="bold" style={[typography.name, styles.cardTitle]}>
                  {overview.mode === 'future' && data.budgetPlan ? 'Not planned' : !data.budgetPlan ? 'No budget yet' : 'Not planned'}
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3, marginBottom: 10 }]}>
                  {overview.mode === 'future' && data.budgetPlan
                    ? 'This future month has no budget snapshot.'
                    : !data.budgetPlan
                      ? 'Create a budget to start planning.'
                      : `Apply your plan to ${formatMonth(month)} to start planning this month.`}
                </AppText>
                {overview.mode !== 'past' ? (
                  <Button
                    label={!data.budgetPlan ? 'Create budget' : `Apply plan to ${formatMonth(month)}`}
                    icon={!data.budgetPlan ? 'plus' : 'check'}
                    variant="primary"
                    onPress={() => {
                      if (data.budgetPlan) void apply();
                      else createBudget();
                    }}
                  />
                ) : null}
              </Card>
            </View>
          ) : (
            <>
              <View testID="budget-overview-card">
                <Card style={styles.overviewCard}>
                  <AppText weight="bold" style={[typography.name, styles.overviewTitle]}>Overview</AppText>
                  <View style={styles.metricTable}>
                    <View testID="budget-overview-table-header" style={[styles.metricTableHeader, stackMetrics && styles.metricTableRowStacked]}>
                      <View style={styles.metricTableLabel} />
                      <AppText style={[typography.label, styles.metricColumn]}>Actual</AppText>
                      <AppText style={[typography.label, styles.metricColumn]}>Planned</AppText>
                    </View>
                    <OverviewMetricRow label="Income" planned={overview.stacked.income.planned} actual={overview.stacked.income.actual} stacked={stackMetrics} />
                    <OverviewMetricRow label="Spending" planned={overview.stacked.spend.planned} actual={overview.stacked.spend.actual} stacked={stackMetrics} />
                    <OverviewMetricRow label="Investing" planned={overview.stacked.invest.planned} actual={overview.stacked.invest.actual} stacked={stackMetrics} />
                    <OverviewMetricRow label="Left" planned={overview.stacked.left.planned} actual={overview.stacked.left.actual} stacked={stackMetrics} />
                  </View>
                  <AppText
                    testID="budget-overview-summary"
                    numberOfLines={1}
                    accessibilityLabel={overviewAccessibility}
                    style={[typography.meta, { color: colors.text2 }]}>
                    {overview.stacked.left.actual < 0
                      ? `Over by ${formatAmount(Math.abs(overview.stacked.left.actual), 'exact', 1)}`
                      : `Left ${formatAmount(overview.stacked.left.actual, 'exact', 1)}`}
                  </AppText>
                </Card>
              </View>

              {overview.pace ? (
                <View testID="budget-pace">
                  <Card style={styles.overviewCard}>
                    <AppText weight="bold" style={[typography.name, styles.overviewTitle]}>Pace</AppText>
                    <PaceLine
                      pace={overview.pace}
                      summary={overview.summary.pace ?? ''}
                      shortSummary={overview.stacked.left.actual < 0
                        ? `Over by ${formatAmount(Math.abs(overview.stacked.left.actual), 'exact', 1)}`
                        : `Left ${formatAmount(overview.stacked.left.actual, 'exact', 1)}`}
                    />
                  </Card>
                </View>
              ) : null}

              <View testID="budget-section-list" style={styles.sectionList}>
                {overview.sections.map((section) => {
                  const definition = activeBudget?.sections.find((candidate) => candidate.id === section.id);
                  const label = section.id === 'other-not-in-budget' ? 'Unbudgeted' : section.name;
                  const isPast = overview.mode === 'past';
                  const canManageSection = !isPast && definition?.system === undefined && definition !== undefined
                    && section.id !== 'other-not-in-budget';
                  const canAddIncome = !isPast && definition?.system === 'income';
                  const canAddInsurance = !isPast && definition?.system === 'insurance';
                  const sectionActions = canManageSection || canAddIncome || canAddInsurance;
                  const recurringIncomeItems = section.items.filter((item) =>
                    item.kind === 'income' && item.nextDueMonth !== undefined,
                  );
                  const recurringIncomeIds = new Set(recurringIncomeItems.map((item) => item.id));
                  const visibleItems = section.items.filter((item) => !recurringIncomeIds.has(item.id));
                  return (
                    <View key={section.id} testID={`budget-section-${section.id}`}>
                    <Card style={styles.sectionCard}>
                      <View
                        testID={`budget-section-header-${section.id}`}
                        style={[styles.sectionHeader, stackMetrics && styles.sectionHeaderStacked]}>
                        <View style={styles.sectionHeading}>
                          <AppText weight="semibold" style={[typography.name, styles.sectionTitle]}>{label}</AppText>
                          {canAddInsurance ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Manage policies"
                              onPress={() => router.push('/insurance')}
                              style={styles.managePolicies}>
                              <AppText style={[typography.meta, { color: colors.primary }]}>Manage policies</AppText>
                            </Pressable>
                          ) : null}
                        </View>
                        {sectionActions ? (
                          <View
                            testID={`budget-section-actions-${section.id}`}
                            style={[styles.sectionIconActions, stackMetrics && styles.sectionIconActionsStacked]}>
                            {canManageSection ? (
                              <>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Rename section"
                                  accessibilityHint={`Rename ${label}`}
                                  onPress={() => router.push({
                                    pathname: '/budget-section-form',
                                    params: {
                                      month,
                                      sectionId: section.id,
                                      name: section.name,
                                      type: definition?.type ?? 'spend',
                                      scope: scopeFor(false),
                                    },
                                  })}
                                  style={styles.sectionActionButton}>
                                  <Feather name="edit-2" size={18} color={colors.primary} />
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Delete section"
                                  accessibilityHint={`Delete ${label} and its items`}
                                  onPress={() => confirmDeleteSection(section.id, section.name)}
                                  style={styles.sectionActionButton}>
                                  <Feather name="trash-2" size={18} color={colors.err} />
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Add item"
                                  accessibilityHint={`Add an item to ${label}`}
                                  onPress={() => router.push({
                                    pathname: '/budget-item-form',
                                    params: { month, sectionId: section.id, scope: scopeFor(true) },
                                  })}
                                  style={styles.sectionActionButton}>
                                  <Feather name="plus" size={20} color={colors.primary} />
                                </Pressable>
                              </>
                            ) : canAddIncome ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Add income"
                                accessibilityHint="Add an income item"
                                onPress={() => router.push({
                                  pathname: '/budget-income-form',
                                  params: { month, scope: scopeFor(true) },
                                })}
                                style={styles.sectionActionButton}>
                                <Feather name="plus" size={20} color={colors.primary} />
                              </Pressable>
                            ) : canAddInsurance ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Add item"
                                accessibilityHint="Add a manual Insurance budget item"
                                onPress={() => router.push({
                                  pathname: '/budget-item-form',
                                  params: { month, sectionId: section.id, scope: scopeFor(true) },
                                })}
                                style={styles.sectionActionButton}>
                                <Feather name="plus" size={20} color={colors.primary} />
                              </Pressable>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                      <AppText
                        weight="semibold"
                        accessibilityLabel={`${formatAmount(section.actual, 'exact', 1)} spent of ${formatAmount(section.planned, 'exact', 1)}`}
                        style={[typography.meta, { color: colors.text2 }]}>
                        <AmountText value={section.actual} tier="tile" /> spent of <AmountText value={section.planned} tier="tile" />
                      </AppText>
                      {visibleItems.length > 0 || recurringIncomeItems.length > 0 ? (
                        <View style={styles.sectionItems}>
                          {visibleItems.map((item, index) => {
                            const rowStyle = [
                              styles.overviewRow,
                              stackMetrics && styles.overviewRowStacked,
                              index < section.items.length - 1
                                ? [styles.rowDivider, { borderBottomColor: colors.border }]
                                : undefined,
                            ];
                            const contents = (
                              <>
                                <View style={styles.rowTitleContainer}>
                                  <AppText style={[typography.meta, styles.rowTitle]}>
                                    {item.title}
                                    {item.frequency && !item.nextDueMonth
                                      ? ` · ${budgetFrequencyLabels[item.frequency]}`
                                      : ''}
                                  </AppText>
                                  {item.nextDueMonth ? (
                                    <AppText style={[typography.meta, { color: colors.text3 }]}>
                                      Next due {formatDate(`${item.nextDueMonth}-01`).slice(2)}
                                    </AppText>
                                  ) : null}
                                </View>
                                <View style={styles.rowValueAndAction}>
                                  <AppText
                                    style={typography.meta}
                                    accessibilityLabel={`${item.title}, ${formatAmount(item.actual, 'exact', 1)} of ${formatAmount(item.planned, 'exact', 1)}`}>
                                    <AmountText value={item.actual} tier="row" /> / <AmountText value={item.planned} tier="row" />
                                  </AppText>
                                  {!isPast && item.source.kind !== 'policy' && (item.kind === 'linked' || item.editable) ? (
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={`Edit ${item.title}`}
                                      accessibilityHint={`Edit ${item.title}`}
                                      onPress={() => openBudgetItem(item, section.id)}
                                      style={styles.editButton}>
                                      <Feather name="edit-2" size={16} color={colors.primary} />
                                    </Pressable>
                                  ) : null}
                                </View>
                              </>
                            );
                            const policyId = item.source.kind === 'policy' ? item.source.parentId : undefined;
                            return policyId ? (
                              <Pressable
                                key={item.id}
                                testID={`budget-row-${item.id}`}
                                accessibilityRole="button"
                                accessibilityLabel={`Edit ${item.title}`}
                                accessibilityHint="Opens the linked policy for editing"
                                onPress={() => router.push({ pathname: '/policy-form', params: { id: policyId } })}
                                style={rowStyle}>
                                {contents}
                              </Pressable>
                            ) : (
                              <View key={item.id} testID={`budget-row-${item.id}`} style={rowStyle}>
                                {contents}
                              </View>
                            );
                          })}
                          {recurringIncomeItems.length > 0 ? (
                            <>
                              <Pressable
                                testID="budget-recurring-income-toggle"
                                accessibilityRole="button"
                                accessibilityLabel={`Recurring income, ${recurringIncomeItems.length} items`}
                                accessibilityState={{ expanded: recurringIncomeExpanded }}
                                onPress={() => setRecurringIncomeExpanded((expanded) => !expanded)}
                                style={[styles.overviewRow, styles.rowDivider, { borderBottomColor: colors.border }]}>
                                <AppText weight="semibold" style={typography.meta}>Recurring income</AppText>
                                <Feather
                                  name={recurringIncomeExpanded ? 'chevron-up' : 'chevron-down'}
                                  size={18}
                                  color={colors.primary}
                                />
                              </Pressable>
                              {recurringIncomeExpanded ? recurringIncomeItems.map((item, index) => {
                                const nextDueMonth = item.nextDueMonth;
                                if (!nextDueMonth) return null;
                                const notDueLabel = `Not due this month, next due ${formatMonth(nextDueMonth)}`;
                                return (
                                  <View
                                    key={item.id}
                                    testID={`budget-recurring-income-row:${item.source.kind === 'income' ? item.source.incomeId : item.id}`}
                                    style={[
                                      styles.overviewRow,
                                      stackMetrics && styles.overviewRowStacked,
                                      index < recurringIncomeItems.length - 1
                                        ? [styles.rowDivider, { borderBottomColor: colors.border }]
                                        : undefined,
                                    ]}>
                                    <View style={styles.rowTitleContainer}>
                                      <AppText style={[typography.meta, styles.rowTitle]}>{item.title}</AppText>
                                      <AppText
                                        accessibilityLabel={notDueLabel}
                                        style={[typography.meta, { color: colors.text3 }]}>
                                        {notDueLabel}
                                      </AppText>
                                    </View>
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={`Edit ${item.title}`}
                                      accessibilityHint={`Edit ${item.title}`}
                                      onPress={() => openBudgetItem(item, section.id)}
                                      style={styles.editButton}>
                                      <Feather name="edit-2" size={16} color={colors.primary} />
                                    </Pressable>
                                  </View>
                                );
                              }) : null}
                            </>
                          ) : null}
                        </View>
                      ) : section.id === 'other-not-in-budget' ? null : (
                        <AppText style={[typography.meta, { color: colors.text3 }]}>No items yet.</AppText>
                      )}
                    </Card>
                    </View>
                  );
                })}
              </View>
            </>
          )}
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
  const { colors } = useTheme();
  const swatchColor = label === 'Spending'
    ? colors.primary
    : label === 'Investing'
      ? colors.purple
      : label === 'Left'
        ? colors.ok
        : colors.text3;
  return (
    <View
      testID={`budget-overview-metric-${label.toLowerCase()}`}
      style={[styles.overviewMetricRow, stacked && styles.overviewMetricRowStacked, { borderBottomColor: colors.border }]}>
      <View style={styles.metricTableLabel}>
        <View style={[styles.metricSwatch, { backgroundColor: swatchColor }]} />
        <AppText style={typography.meta}>{label}</AppText>
      </View>
      <View style={[styles.overviewMetricValues, stacked && styles.overviewMetricValuesStacked]}>
        <View style={styles.metricValue}>
          <AmountText value={actual} tier="row" weight="semibold" />
        </View>
        <View style={styles.metricValue}>
          <AmountText value={planned} tier="row" weight="semibold" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  content: { paddingBottom: 28, gap: 16 },
  monthHeader: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  todayButton: { minWidth: 44, minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 22 },
  disabled: { opacity: 0.45 },
  cardTitle: { marginBottom: 8 },
  screenCard: { marginTop: 0 },
  overviewCard: { marginTop: 0, padding: 16, gap: 16 },
  overviewTitle: { marginBottom: 0 },
  metricRows: { gap: 8 },
  metricRowsStacked: { gap: 12 },
  metricRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metricTable: { gap: 0 },
  metricTableHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center' },
  metricTableRowStacked: { alignItems: 'flex-end' },
  metricTableLabel: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricColumn: { width: 80, textAlign: 'right' },
  metricSwatch: { width: 8, height: 8, borderRadius: 4 },
  overviewMetricRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  overviewMetricRowStacked: { alignItems: 'stretch', flexDirection: 'column' },
  overviewMetricValues: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  overviewMetricValuesStacked: { justifyContent: 'flex-end' },
  metricValue: { width: 80, alignItems: 'flex-end' },
  sectionList: { gap: 16 },
  sectionCard: { marginTop: 0, padding: 16, gap: 12 },
  sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionHeaderStacked: { flexDirection: 'column', alignItems: 'stretch' },
  sectionTitle: { flex: 1, minWidth: 0 },
  sectionHeading: { flex: 1, minWidth: 0 },
  managePolicies: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  sectionIconActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionIconActionsStacked: { alignSelf: 'flex-end' },
  sectionActionButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sectionItems: { gap: 0 },
  overviewRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 6 },
  overviewRowStacked: { alignItems: 'stretch', flexDirection: 'column' },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitleContainer: { flex: 1, minWidth: 0 },
  rowTitle: { minWidth: 0 },
  rowValueAndAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  editButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
