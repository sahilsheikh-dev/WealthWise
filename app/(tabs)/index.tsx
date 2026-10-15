import { router, type Href } from 'expo-router';
import { useIsFocused } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { IconButton } from '../../src/components/IconButton';
import {
  AppText,
  Button,
  Card,
  ProgressBar,
  Screen,
  SectionTitle,
  StatPill,
  StatPillRow,
  WarningBanner,
} from '../../src/components/ui';
import { PendingItemActionSheet } from '../../src/components/PendingItemActionSheet';
import { PendingItemRow } from '../../src/components/PendingItemRow';
import { createMetaStore, type BackupMeta } from '../../src/data/metaStore';
import { useUIStore } from '../../src/data/uiStore';
import { useAppData } from '../../src/data/useAppData';
import { shouldNudge } from '../../src/domain/backupNudge';
import { budgetMonthView } from '../../src/domain/budget';
import { addDays } from '../../src/domain/dates';
import { goalProjection } from '../../src/domain/goalLinks';
import { pendingItems, type PendingItem } from '../../src/domain/pending';
import { homeSummary } from '../../src/domain/summary';
import { expenseCategoryBreakdown, transactionCategoryLabel } from '../../src/domain/transactions';
import { formatAmount } from '../../src/lib/amountDisplay';
import { currentHour, todayISO } from '../../src/lib/clock';
import { formatDate } from '../../src/lib/format';
import { greetingFor } from '../../src/lib/greeting';
import { shouldShowStorageWarning, storageLevel, storageSummary } from '../../src/lib/storageGuard';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export const HOME_QUICK_ACTIONS = [
  { id: 'transaction', label: 'Add Transaction', icon: 'file-plus' },
  { id: 'investment', label: 'New Investment', icon: 'trending-up' },
  { id: 'liability', label: 'New Liability', icon: 'credit-card' },
  { id: 'emergency-fund', label: 'Log Emergency Fund', icon: 'shield' },
] as const;
const metaStore = createMetaStore(AsyncStorage);

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function HomeScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const data = useAppData();
  const today = todayISO();
  const month = today.slice(0, 7);
  const summary = homeSummary(data, today);
  const monthBudget = budgetMonthView(data, month);
  const spendingByCategory = expenseCategoryBreakdown(data.transactions, month);
  const dueItems = pendingItems(data, month, today)
    .filter((item) => item.kind === 'due')
    .slice(0, 5);
  const [spendingState, setSpendingState] = useState({ focused: isFocused, expanded: false });
  if (spendingState.focused !== isFocused) {
    setSpendingState({ focused: isFocused, expanded: false });
  }
  const spendingExpanded = spendingState.expanded;
  const [selectedDue, setSelectedDue] = useState<PendingItem | null>(null);
  const [backupMeta, setBackupMeta] = useState<BackupMeta>({});
  const persistedBytes = useUIStore((state) => state.persistedBytes);
  useEffect(() => {
    void metaStore.getMeta().then(setBackupMeta);
  }, []);
  const recordCount = data.transactions.length
    + data.goals.filter((goal) => !goal.auto).length
    + data.holdings.length + data.liabilities.length + data.efEntries.length;
  const nudge = shouldNudge({
    recordCount,
    lastExportAt: backupMeta.lastExportAt,
    nudgeDismissedUntil: backupMeta.nudgeDismissedUntil,
    today,
  });
  const storageStatus = persistedBytes === null ? 'ok' : storageLevel(persistedBytes);
  const showStorageWarning = persistedBytes !== null
    && shouldShowStorageWarning(persistedBytes, backupMeta.storageWarnDismissedUntil, today);
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
            label="Emergency Fund"
            value={summary.emergencyMonths === null ? '—' : `${summary.emergencyMonths.toFixed(1)} mo`}
            tone="primary"
            onPress={() => router.push('/emergency-fund')}
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
              router.push('/ef-entry-form');
            }}
            />
          </View>
        ))}
      </View>

      <SectionTitle>Spending by category</SectionTitle>
      <Card style={styles.categoryBreakdown}>
        <AppText
          weight="semibold"
          accessibilityLabel={`This month: ${formatAmount(monthBudget.actualSpend, 'exact', 1)} spent of ${formatAmount(monthBudget.plannedSpend, 'exact', 1)}`}>
          This month: <AmountText value={monthBudget.actualSpend} tier="tile" /> spent of <AmountText value={monthBudget.plannedSpend} tier="tile" />
        </AppText>
        <View style={styles.spendingActions}>
          <Button label="Open budget" icon="pie-chart" onPress={() => router.push('/(tabs)/budget')} />
          {!monthBudget.budget ? (
            <Button
              label="Apply budget"
              icon="layers"
              onPress={() => router.push({ pathname: '/(tabs)/budget', params: { month, apply: '1' } })}
            />
          ) : null}
        </View>
        <Pressable
          testID="home-spending-toggle"
          accessibilityRole="button"
          accessibilityLabel={spendingExpanded ? 'Hide spending by category' : 'Show spending by category'}
          accessibilityState={{ expanded: spendingExpanded }}
          onPress={() => setSpendingState((current) => ({ ...current, expanded: !current.expanded }))}
          style={[styles.spendingToggle, { borderTopColor: colors.border }]}>
          <AppText style={{ color: colors.primary }}>
            {spendingExpanded ? 'Hide spending by category' : 'Show spending by category'}
          </AppText>
          <Feather name={spendingExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
        </Pressable>
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
          <SectionTitle>Upcoming and due</SectionTitle>
          <Card style={styles.upcomingCard}>
            {dueItems.map((item) => (
              <PendingItemRow
                key={item.id}
                item={item}
                onPress={() => setSelectedDue(item)}
              />
            ))}
          </Card>
        </>
      ) : null}
      <PendingItemActionSheet
        item={selectedDue}
        today={today}
        onClose={() => setSelectedDue(null)}
        onViewSchedule={(item) => {
          setSelectedDue(null);
          if (item.source.kind === 'plan') {
            router.push(`/investment-entries?id=${encodeURIComponent(item.source.parentId)}` as Href);
          } else if (item.source.kind === 'liability') {
            router.push({ pathname: '/liability-payments', params: { id: item.source.parentId } });
          }
        }}
      />

      <SectionTitle>Goal Progress</SectionTitle>
      {summary.goals.slice(0, 3).map(({ goal, target, saved, pct, minimum, raised }) => {
        const projection = goalProjection(goal, data, today);
        const targetYearPassed = goal.year < Number(today.slice(0, 4)) && pct < 100;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${goal.name}, target ${formatAmount(target, 'exact', 1)}, saved ${formatAmount(saved, 'exact', 1)}, ${formatAmount(Math.max(0, target - saved), 'exact', 1)} left, ${goal.year}, ${pct.toFixed(1)}% funded`}
            accessibilityHint="Opens this goal for editing"
            onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
            style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            <ProgressBar percent={pct} />
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
            {goal.auto !== 'ef' ? (
              <AppText style={[typography.meta, { color: colors.text2 }]}>
                {projection.projectedDate === 'Already reached'
                  ? 'Already reached'
                  : projection.projectedDate
                    ? `Projected ${formatDate(projection.projectedDate)} · ${projection.status === 'ahead'
                      ? 'Ahead'
                      : projection.status === 'on-track' ? 'On track' : 'Behind'}`
                    : 'Not reachable with current contributions'}
              </AppText>
            ) : null}
            {goal.auto === 'ef' ? (
              <>
                <AppText
                  style={[typography.meta, styles.goalMinimum, { color: colors.text3 }]}
                  accessibilityLabel={`Minimum 3 months of expenses: ${formatAmount(minimum ?? 0, 'exact', 1)}`}>
                  Minimum 3 months of expenses: <AmountText value={minimum ?? 0} tier="row" />
                </AppText>
                <AppText
                  style={[typography.meta, { color: colors.text3 }]}
                  accessibilityLabel={summary.expenseBaseline <= 0
                    ? 'Add expenses to calculate your 3-month minimum'
                    : `Based on an average of ${formatAmount(summary.expenseBaseline, 'exact', 1)} monthly expenses`}>
                  {summary.expenseBaseline <= 0
                    ? 'Add expenses to calculate your 3-month minimum'
                    : <>Based on an average of <AmountText value={summary.expenseBaseline} tier="row" /> monthly expenses</>}
                </AppText>
                {raised ? (
                  <AppText style={[typography.meta, { color: colors.text3 }]}>Raised to the 3-month minimum</AppText>
                ) : null}
              </>
            ) : null}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeHeader: { paddingHorizontal: 20, paddingTop: 16, gap: 2 },
  netWorth: { marginTop: 5 },
  categoryBreakdown: { gap: 10 },
  categoryRows: { gap: 4 },
  spendingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spendingToggle: { minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  categoryRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  backupCard: { gap: 10 },
  backupActions: { flexDirection: 'row', gap: 8 },
  storageActions: { gap: 8, marginTop: 8 },
  quickActions: { marginHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 8 },
  upcomingCard: { gap: 7 },
  dueRow: { minHeight: 54, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  dueTitle: { flex: 1, minWidth: 0, gap: 3 },
  dueRight: { alignItems: 'flex-end', gap: 4 },
  quickAction: { minHeight: 56, flex: 1, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  goal: { marginHorizontal: 20, marginBottom: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goalNameBlock: { flex: 1, minWidth: 0, gap: 3 },
  goalPercent: { fontSize: 12 },
  goalAmounts: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  goalMinimum: { marginTop: 7 },
});
