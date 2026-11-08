import { router, useIsFocused, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { BudgetSummaryToggle } from '../../src/components/BudgetSummaryToggle';
import { GoalProgressRow } from '../../src/components/GoalProgressRow';
import { IconButton } from '../../src/components/IconButton';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Screen,
  StatPill,
  StatPillRow,
  WarningBanner
} from '../../src/components/ui';
import { createMetaStore, type BackupMeta } from '../../src/data/metaStore';
import { useAppStore } from '../../src/data/store';
import { useUIStore } from '../../src/data/uiStore';
import { useAppActions, useAppData } from '../../src/data/useAppData';
import { shouldNudge } from '../../src/domain/backupNudge';
import { budgetMonthView, createDefaultBudgetPlan } from '../../src/domain/budget';
import { coverGoalSummaries } from '../../src/domain/coverGoals';
import { addDays } from '../../src/domain/dates';
import { duesThroughPreview, type DueTarget } from '../../src/domain/dues';
import { goalProjection } from '../../src/domain/goalLinks';
import { pendingItems, type PendingItem } from '../../src/domain/pending';
import { policySummary } from '../../src/domain/policySummary';
import { homeSummary } from '../../src/domain/summary';
import { expenseCategoryBreakdown, transactionCategoryLabel } from '../../src/domain/transactions';
import { formatAmount } from '../../src/lib/amountDisplay';
import { currentHour, todayISO } from '../../src/lib/clock';
import { confirmAsync } from '../../src/lib/confirm';
import { formatDate } from '../../src/lib/format';
import { greetingFor } from '../../src/lib/greeting';
import { shouldShowStorageWarning, storageLevel, storageSummary } from '../../src/lib/storageGuard';
import { PaidAmountDialog } from '../../src/components/PaidAmountDialog';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export const HOME_QUICK_ACTIONS = [
  { id: 'transaction', label: 'New Transaction', icon: 'file-plus' },
  { id: 'investment', label: 'New Investment', icon: 'trending-up' },
  { id: 'liability', label: 'New Liability', icon: 'credit-card' },
] as const;
const metaStore = createMetaStore(AsyncStorage);

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const isFocused = useIsFocused();
  const data = useAppData();
  const actions = useAppActions();
  const today = todayISO();
  const month = today.slice(0, 7);
  const summary = homeSummary(data, today);
  const coverGoals = coverGoalSummaries(data, today);
  const termLifeGoal = coverGoals.find((goal) => goal.type === 'term-life');
  const insuranceSummary = policySummary(data, today);
  const monthBudget = budgetMonthView(data, month, today);
  const spendingByCategory = expenseCategoryBreakdown(data.transactions, month);
  const dueItems = pendingItems(data, month, today)
    .filter((item) => item.kind === 'due')
    .slice(0, 5);
  const [spendingState, setSpendingState] = useState({ focused: isFocused, expanded: false });
  if (spendingState.focused !== isFocused) {
    setSpendingState({ focused: isFocused, expanded: false });
  }
  const spendingExpanded = spendingState.expanded;
  const [backupMeta, setBackupMeta] = useState<BackupMeta>({});
  const [homePayment, setHomePayment] = useState<PendingItem | null>(null);
  const persistedBytes = useUIStore((state) => state.persistedBytes);
  const setActionToast = useUIStore((state) => state.setActionToast);
  useEffect(() => {
    void metaStore.getMeta().then(setBackupMeta);
  }, []);
  const recordCount = data.transactions.length
    + data.goals.filter((goal) => !goal.auto).length
    + data.holdings.length + data.liabilities.length;
  const nudge = shouldNudge({
    recordCount,
    lastExportAt: backupMeta.lastExportAt,
    nudgeDismissedUntil: backupMeta.nudgeDismissedUntil,
    today,
  });
  const storageStatus = persistedBytes === null ? 'ok' : storageLevel(persistedBytes);
  const showStorageWarning = persistedBytes !== null
    && shouldShowStorageWarning(persistedBytes, backupMeta.storageWarnDismissedUntil, today);
  const createBudget = () => {
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    actions.saveAndApplyBudgetPlan(createDefaultBudgetPlan(month), month);
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not create budget', error);
      return;
    }
    setActionToast({
      message: 'Budget created',
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(null, month, previousMonth),
    });
  };
  const handleDuePress = async (item: PendingItem) => {
    if (item.source.kind !== 'plan' && item.source.kind !== 'liability' && item.source.kind !== 'policy') return;
    if (!item.dueDate) {
      Alert.alert('Unable to clear due', 'This item has no scheduled due date.');
      return;
    }
    const target: DueTarget = { kind: item.source.kind, id: item.source.parentId };
    const preview = item.actionable
      ? null
      : duesThroughPreview(data, target, item.dueDate, today);
    if (preview && preview.count === 0) {
      Alert.alert('Unable to clear due', 'This due is no longer outstanding.');
      return;
    }
    const clearThrough = preview !== null && preview.count > 1;
    const extra = clearThrough && preview
      ? `\nThis also clears ${preview.count - 1} earlier dues, ${formatAmount(preview.amount, 'exact', 1)} total.`
      : '';
    setHomePayment(item);
    return;

    if (clearThrough && preview) {
      const entryIds = actions.clearDuesThrough(target, item.dueDate);
      if (!entryIds || useAppStore.getState().lastError) {
        Alert.alert('Unable to clear due', useAppStore.getState().lastError ?? 'The due could not be cleared.');
        return;
      }
      const sourceKind = target.kind === 'plan'
        ? 'holding-entry'
        : target.kind === 'liability' ? 'liability-payment' : 'policy-payment';
      const transactions = entryIds.map((entryId) => useAppStore.getState().data.transactions.find((transaction) =>
        transaction.source?.kind === sourceKind
        && transaction.source.parentId === target.id
        && transaction.source.entryId === entryId,
      ));
      if (transactions.some((transaction) => transaction === undefined)) {
        Alert.alert('Unable to clear due', 'A linked transaction could not be found.');
        return;
      }
      let total = 0;
      for (const transaction of transactions) {
        if (!transaction) {
          Alert.alert('Unable to clear due', 'A linked transaction could not be found.');
          return;
        }
        total += transaction.amount;
      }
      setActionToast({
        message: `${formatAmount(total, 'exact', 1)} marked as paid`,
        actionLabel: 'Undo',
        onAction: () => {
          actions.undoClearDuesThrough(target, entryIds);
          const error = useAppStore.getState().lastError;
          if (error) Alert.alert('Unable to undo', error);
        },
      });
      return;
    }

    const entryId = actions.clearDue(target, item.source.slotId);
    if (!entryId || useAppStore.getState().lastError) {
      Alert.alert('Unable to clear due', useAppStore.getState().lastError ?? 'The due could not be cleared.');
      return;
    }
    const transaction = useAppStore.getState().data.transactions.find((candidate) =>
      (candidate.source?.kind === 'holding-entry'
        || candidate.source?.kind === 'liability-payment'
        || candidate.source?.kind === 'policy-payment')
      && candidate.source.parentId === target.id
      && candidate.source.entryId === entryId,
    );
    if (!transaction) {
      Alert.alert('Unable to clear due', 'The linked transaction could not be found.');
      return;
    }
    setActionToast({
      message: `${formatAmount(transaction.amount, 'exact', 1)} marked as paid`,
      actionLabel: 'Undo',
      onAction: () => {
        actions.undoClearDue(target, entryId);
        const error = useAppStore.getState().lastError;
        if (error) Alert.alert('Unable to undo', error);
      },
    });
  };
  const saveHomePayment = (actualAmount: number) => {
    const item = homePayment;
    if (!item || !item.dueDate) return;
    const source = item.source;
    if (source.kind !== 'plan' && source.kind !== 'liability' && source.kind !== 'policy') return;
    const target: DueTarget = { kind: source.kind, id: source.parentId };
    if (!item.actionable) {
      const entryIds = actions.clearDuesThrough(target, item.dueDate, actualAmount);
      if (!entryIds || useAppStore.getState().lastError) {
        Alert.alert('Unable to clear due', useAppStore.getState().lastError ?? 'The due could not be cleared.');
        return;
      }
      setActionToast({ message: `${formatAmount(actualAmount, 'exact', 1)} marked as paid`, actionLabel: 'Undo', onAction: () => {
        actions.undoClearDuesThrough(target, entryIds);
      } });
    } else {
      const entryId = actions.clearDue(target, source.slotId, actualAmount);
      if (!entryId || useAppStore.getState().lastError) {
        Alert.alert('Unable to clear due', useAppStore.getState().lastError ?? 'The due could not be cleared.');
        return;
      }
      setActionToast({ message: `${formatAmount(actualAmount, 'exact', 1)} marked as paid`, actionLabel: 'Undo', onAction: () => {
        actions.undoClearDue(target, entryId);
      } });
    }
    setHomePayment(null);
  };
  return (
    <Screen>
      <AppHeader title={`${greetingFor(currentHour())}, ${data.settings.name || 'Welcome'}`} />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Net Worth</AppText>
        <AmountText value={summary.netWorth} tier="hero" tone={summary.netWorth < 0 ? 'err' : 'primary'} weight="bold" style={[typography.big, styles.netWorth]} />
        <StatPillRow>
          <StatPill
            label="Assets"
            value={<AmountText value={summary.assets} tier="tile" />}
            accessibilityLabel={`Assets, ${formatAmount(summary.assets, 'exact', 1)}`}
            tone="ok"
            onPress={() => router.push('/assets' as Href)}
          />
          <StatPill
            label="Liabilities"
            value={<AmountText value={summary.liabilities} tier="tile" />}
            accessibilityLabel={`Liabilities, ${formatAmount(summary.liabilities, 'exact', 1)}`}
            tone="err"
            onPress={() => router.push('/liabilities')}
          />
          <StatPill
            label="Emergency fund"
            value={summary.emergencyMonths === null ? '—' : `${Math.trunc(summary.emergencyMonths * 10) / 10} mo`}
            accessibilityLabel={`Emergency fund, ${formatAmount(summary.goals.find(({ goal }) => goal.auto === 'ef')?.saved ?? 0, 'exact', 1)}, ${
              summary.emergencyMonths === null
                ? 'cover unavailable'
                : `${Math.trunc(summary.emergencyMonths * 10) / 10} months of cover`
            }`}
            tone="primary"
            onPress={() => router.push('/emergency-fund')}
          />
          <StatPill
            label="Insurance"
            value={data.policies.length === 0
              ? 'No policies yet'
              : <AmountText value={insuranceSummary.totalCover} tier="tile" />}
            accessibilityLabel={data.policies.length === 0
              ? 'Insurance, No policies yet'
              : `Insurance, total cover ${formatAmount(insuranceSummary.totalCover, 'exact', 1)}`}
            tone="primary"
            onPress={() => router.push(data.policies.length === 0 ? '/policy-form' : '/insurance')}
            testID="home-insurance-card"
          />
        </StatPillRow>
      </Card>

      <View style={styles.quickActions}>
        {HOME_QUICK_ACTIONS.map((action) => (
          <View
            key={action.label}
            style={styles.quickAction}>
            <IconButton
              icon={action.icon}
              label={action.label}
              labelPosition="below"
              onPress={() => {
              if (action.id === 'transaction') {
                router.push('/transaction-form');
                return;
              }
              if (action.id === 'investment') {
                router.push('/investment-form' as Href);
                return;
              }
              if (action.id === 'liability') {
                router.push('/liability-form');
                return;
              }
            }}
            />
          </View>
        ))}
      </View>

      <Card style={styles.categoryBreakdown}>
        <BudgetSummaryToggle
          label="This month:"
          spent={monthBudget.actualSpend}
          planned={monthBudget.plannedSpend}
          expanded={spendingExpanded}
          accessibilityLabel={spendingExpanded ? 'Hide spending by category' : 'Show spending by category'}
          testID="home-spending-toggle"
          topBorder
          onPress={() => setSpendingState((current) => ({ ...current, expanded: !current.expanded }))}>
        {spendingExpanded ? spendingByCategory.length > 0 ? (
          <View testID="home-spending-details" style={styles.categoryRows}>
            {spendingByCategory.map(({ category, amount }) => (
              <View key={category} style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
                <AppText style={{ color: colors.text2 }}>{transactionCategoryLabel(category)}</AppText>
                <AmountText value={amount} tier="row" weight="semibold" />
              </View>
            ))}
          </View>
        ) : <AppText style={[typography.meta, { color: colors.text3 }]}>No spending recorded this month.</AppText> : null}
        {!monthBudget.budget ? (
          <Button
            label={data.budgetPlan ? 'Apply budget' : 'Create budget'}
            accessibilityLabel={data.budgetPlan ? 'Apply budget' : 'Create budget'}
            onPress={() => {
              if (!data.budgetPlan) createBudget();
              else router.push({ pathname: '/(tabs)/budget', params: { month, apply: '1' } });
            }}
          />
        ) : null}
        </BudgetSummaryToggle>
      </Card>

      {nudge.show ? (
        <Card style={styles.backupCard}>
          <AppText weight="semibold">
            {nudge.reason === 'stale'
              ? `Your last export was ${nudge.days} days ago.`
              : 'You have data that exists only on this phone. Export a backup.'}
          </AppText>
          <View style={styles.backupActions}>
            <Button label="Export now" icon="download" variant="primary" onPress={() => router.push('/backup')} />
            <Button
              label="Later"
              onPress={() => {
                void metaStore.updateMeta({ nudgeDismissedUntil: addDays(today, 7) })
                  .then(setBackupMeta)
                  .catch(() => Alert.alert('Could not save', 'The reminder could not be dismissed. Try again.'));
              }}
            />
          </View>
        </Card>
      ) : null}

      {showStorageWarning && persistedBytes !== null ? (
        <Card>
          <WarningBanner>
            {storageStatus === 'critical'
              ? `Storage is almost full (${storageSummary(persistedBytes)}). Export a backup and free space before making more changes.`
              : `Your saved data is growing (${storageSummary(persistedBytes)}). Consider exporting a backup.`}
          </WarningBanner>
          <View style={styles.storageActions}>
            <Button label="Open backup" icon="download" variant="primary" onPress={() => router.push('/backup')} />
            {storageStatus !== 'critical' ? (
              <Button
                label="Dismiss for 7 days"
                onPress={() => {
                  void metaStore.updateMeta({ storageWarnDismissedUntil: addDays(today, 7) })
                    .then(setBackupMeta)
                    .catch(() => Alert.alert('Could not save', 'The storage reminder could not be dismissed. Try again.'));
                }}
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      {dueItems.length > 0 ? (
        <>
          <AppText weight="bold" style={{ color: colors.text3, marginHorizontal: 20, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>Upcoming and due</AppText>
          <Card style={styles.upcomingCard}>
            {dueItems.map((item) => (
              <View
                key={item.id}
                testID={`home-due-row-${item.id}`}
                style={[
                  styles.dueRow,
                  fontScale >= 1.3 && styles.dueRowStacked,
                  { borderBottomColor: colors.border },
                ]}>
                <View style={styles.dueTitle}>
                  <AppText weight="regular">
                    Due <AmountText value={item.amount} tier="row" weight="semibold" /> for {item.title} on {item.dueDate ? formatDate(item.dueDate) : 'Date unavailable'}
                  </AppText>
                </View>
                <View
                  testID={`home-due-actions-${item.id}`}
                  style={[styles.dueActions, fontScale >= 1.3 && styles.dueActionsStacked]}>
                  <Button
                    label={'Paid'}
                    accessibilityHint="Confirms whether this scheduled item was paid."
                    style={styles.markPaidButton}
                    onPress={() => { void handleDuePress(item); }}
                  />
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <AppText weight="bold" style={{ color: colors.text3, marginHorizontal: 20, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>Goal Progress</AppText>
      <View testID="home-goals-section">
        <Card style={styles.goalsCard}>
          {summary.goals.slice(0, 3).map(({ goal, target, saved, pct, minimum, raised }, index, goals) => {
            const projection = goalProjection(goal, data, today);
            const targetYearPassed = goal.year < Number(today.slice(0, 4)) && pct < 100;
            return (
              <Pressable
                key={goal.id}
                testID={`home-goal-row-${goal.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${goal.name}, target ${formatAmount(target, 'exact', 1)}, saved ${formatAmount(saved, 'exact', 1)}, ${formatAmount(Math.max(0, target - saved), 'exact', 1)} left, ${goal.year}, ${pct.toFixed(1)}% funded`}
                accessibilityHint="Opens this goal for editing"
                onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
                style={[
                  styles.goalRow,
                  index < goals.length - 1 && styles.goalRowDivider,
                  { borderBottomColor: colors.border },
                ]}>
                <View style={styles.goalTop}>
                  <View style={styles.goalNameBlock}>
                    <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                    <AppText
                      style={[typography.meta, { color: colors.text3 }]}
                      accessibilityLabel={`Target ${formatAmount(target, 'exact', 1)} · ${goal.year}`}>
                      Target <AmountText value={target} tier="row" /> · {goal.year}
                    </AppText>
                    {targetYearPassed ? (
                      <AppText style={[typography.meta, { color: colors.err }]}>Target year has passed</AppText>
                    ) : null}
                    {goal.links.length > 0 ? (
                      <AppText style={[typography.meta, { color: colors.text3 }]}>
                        Tracking {goal.links.length} {goal.links.length === 1 ? 'asset' : 'assets'}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText weight="bold" style={[styles.goalPercent, { color: colors.primary }]}>{pct.toFixed(1)}%</AppText>
                </View>
                <View style={styles.goalAmounts}>
                  <AppText
                    style={[typography.meta, { color: colors.ok }]}
                    accessibilityLabel={`${formatAmount(saved, 'exact', 1)} saved`}>
                    <AmountText value={saved} tier="row" /> saved
                  </AppText>
                  <AppText
                    style={[typography.meta, { color: colors.text3 }]}
                    accessibilityLabel={`${formatAmount(Math.max(0, target - saved), 'exact', 1)} left`}>
                    <AmountText value={Math.max(0, target - saved)} tier="row" /> left
                  </AppText>
                </View>
                {projection.projectedDate && projection.projectedDate !== 'Already reached' ? (
                  <AppText style={[typography.meta, { color: colors.text2 }]}>
                    Projected {formatDate(projection.projectedDate)}
                  </AppText>
                ) : null}
                {goal.auto === 'ef' ? (
                  <>
                    <AppText
                      style={[typography.meta, styles.goalMinimum, { color: colors.text3 }]}
                      accessibilityLabel={`Minimum 3 months of cover: ${formatAmount(minimum ?? 0, 'exact', 1)}`}>
                      Minimum 3 months of cover: <AmountText value={minimum ?? 0} tier="row" />
                    </AppText>
                    <AppText
                      style={[typography.meta, { color: colors.text3 }]}
                      accessibilityLabel={summary.emergencyBaseSource === 'expenses'
                        ? `Based on your average monthly expenses, ${formatAmount(summary.expenseBaseline, 'exact', 1)}`
                        : summary.emergencyBaseSource === 'salary'
                          ? 'Based on your monthly income'
                          : 'Add your monthly income to see cover'}>
                      {summary.emergencyBaseSource === 'expenses'
                        ? <>Based on your average monthly expenses: <AmountText value={summary.expenseBaseline} tier="row" /></>
                        : summary.emergencyBaseSource === 'salary'
                          ? 'Based on your monthly income'
                          : 'Add your monthly income to see cover'}
                    </AppText>
                    <View style={styles.emergencyGoalActions}>
                      <AppText style={[typography.meta, { color: colors.text2 }]}>
                        {summary.emergencyMonths === null
                          ? '—'
                          : `${Math.trunc(summary.emergencyMonths * 10) / 10} mo of cover`}
                      </AppText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Track emergency fund"
                        onPress={(event) => {
                          event.stopPropagation?.();
                          router.push('/emergency-fund');
                        }}>
                        <AppText style={[typography.meta, { color: colors.primary }]}>Track</AppText>
                      </Pressable>
                    </View>
                    {raised ? (
                      <AppText style={[typography.meta, { color: colors.text3 }]}>Raised to the 3-month minimum</AppText>
                    ) : null}
                  </>
                ) : null}
                <GoalProgressRow percent={pct} />
              </Pressable>
            );
          })}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeHeader: { paddingHorizontal: 20, paddingTop: 16, gap: 2 },
  netWorth: { marginTop: 5 },
  categoryBreakdown: { gap: 10 },
  insuranceCard: { gap: 10 },
  insuranceRow: { minHeight: 42, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  insuranceRowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  insuranceRowStacked: { alignItems: 'flex-start', flexDirection: 'column' },
  insuranceRenewalRow: { paddingVertical: 6 },
  insuranceRenewalDetails: { flex: 1, minWidth: 0, gap: 2 },
  categoryRows: { gap: 4 },
  spendingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  backupCard: { gap: 10 },
  backupActions: { flexDirection: 'row', gap: 8 },
  storageActions: { gap: 8, marginTop: 8 },
  quickActions: { marginHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 8 },
  upcomingCard: { gap: 7 },
  dueRow: { minHeight: 54, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  dueRowStacked: { alignItems: 'stretch', flexDirection: 'column' },
  dueTitle: { flex: 1, minWidth: 0, gap: 3 },
  dueActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dueActionsStacked: { justifyContent: 'flex-end' },
  markPaidButton: { minHeight: 36, paddingHorizontal: 8, backgroundColor: 'transparent', borderWidth: 1 },
  quickAction: { minHeight: 56, flex: 1, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  goalsCard: { paddingVertical: 4 },
  goalRow: { paddingVertical: 14 },
  goalRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goalNameBlock: { flex: 1, minWidth: 0, gap: 3 },
  goalPercent: { fontSize: 12 },
  goalAmounts: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  goalMinimum: { marginTop: 7 },
  emergencyGoalActions: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
