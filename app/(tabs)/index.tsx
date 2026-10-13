import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppHeader } from '../../src/components/AppHeader';
import { AmountText } from '../../src/components/AmountText';
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
  StatusBadge,
  WarningBanner,
} from '../../src/components/ui';
import { createMetaStore, type BackupMeta } from '../../src/data/metaStore';
import { useUIStore } from '../../src/data/uiStore';
import { useAppData } from '../../src/data/useAppData';
import { shouldNudge } from '../../src/domain/backupNudge';
import { addDays } from '../../src/domain/dates';
import { upcomingDue } from '../../src/domain/schedule';
import { goalProjection } from '../../src/domain/goalLinks';
import { budgetMonthView } from '../../src/domain/budget';
import { homeSummary } from '../../src/domain/summary';
import { expenseCategoryBreakdown } from '../../src/domain/transactions';
import { currentHour, todayISO } from '../../src/lib/clock';
import { formatDate } from '../../src/lib/format';
import { formatAmount } from '../../src/lib/amountDisplay';
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
  const data = useAppData();
  const today = todayISO();
  const summary = homeSummary(data, today);
  const monthBudget = budgetMonthView(data, today.slice(0, 7));
  const spendingByCategory = expenseCategoryBreakdown(data.transactions, today.slice(0, 7));
  const dueItems = upcomingDue(data, today, 5);
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
            value={formatAmount(summary.assets, 'tile', 1)}
            accessibilityLabel={`Assets, ${formatAmount(summary.assets, 'exact', 1)}`}
            tone="ok"
            onPress={() => router.push('/assets' as Href)}
          />
          <StatPill
            label="Liabilities"
            value={formatAmount(summary.liabilities, 'tile', 1)}
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
      <Pressable accessibilityRole="button" accessibilityLabel="Open this month's budget" onPress={() => router.push('/(tabs)/budget')}>
        <Card style={styles.monthBudgetCard}>
          <AppText weight="semibold">
            {monthBudget.budget ? (
              <>This month: <AmountText value={monthBudget.actualSpend} tier="tile" /> of <AmountText value={monthBudget.plannedSpend} tier="tile" /> spent</>
            ) : 'Plan your month'}
          </AppText>
          {monthBudget.budget ? (
            <ProgressBar percent={monthBudget.plannedSpend > 0
              ? monthBudget.actualSpend / monthBudget.plannedSpend * 100 : 0} />
          ) : (
            <AppText style={[typography.meta, { color: colors.text3 }]}>Set up a monthly spending plan</AppText>
          )}
          <AppText style={[typography.meta, { color: colors.primary }]}>Open budget</AppText>
        </Card>
      </Pressable>

      {spendingByCategory.length > 0 ? (
        <>
          <SectionTitle>Spending by category</SectionTitle>
          <Card style={styles.categoryBreakdown}>
            {spendingByCategory.map(({ category, amount }) => (
              <View key={category} style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
                <AppText style={{ color: colors.text2 }}>{category}</AppText>
                <AmountText value={amount} tier="row" weight="semibold" />
              </View>
            ))}
          </Card>
        </>
      ) : null}

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

      {dueItems.length > 0 ? (
        <Card style={styles.upcomingCard}>
          <AppText weight="semibold" style={typography.name}>Upcoming and due</AppText>
          {dueItems.map((item) => {
            const noDueDate = item.kind === 'liability'
              && data.liabilities.some((liability) => liability.id === item.parentId && liability.kind === 'one-time' && liability.dueDate === null);
            return (
              <Pressable
                key={`${item.kind}:${item.parentId}:${item.row.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.row.status}, ${formatAmount(item.row.amount, 'exact', 1)}`}
                onPress={() => router.push(item.kind === 'plan'
                  ? `/investment-entries?id=${encodeURIComponent(item.parentId)}` as Href
                  : `/liability-payments?id=${encodeURIComponent(item.parentId)}`)}
                style={[styles.dueRow, { borderBottomColor: colors.border }]}>
                <View style={styles.dueTitle}>
                  <AppText weight="semibold" style={typography.name} numberOfLines={1}>{item.name}</AppText>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    {noDueDate ? 'No due date' : formatDate(item.row.dueDate)}
                  </AppText>
                </View>
                <View style={styles.dueRight}>
                  <AmountText value={item.row.amount} tier="row" weight="semibold" style={typography.meta} />
                  <StatusBadge
                    label={item.row.status}
                    tone={item.row.status === 'overdue' ? 'err' : item.row.status === 'ongoing' ? 'primary' : 'neutral'}
                  />
                </View>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <SectionTitle>Goal Progress</SectionTitle>
      {summary.goals.slice(0, 3).map(({ goal, target, saved, pct, minimum, raised }) => {
        const projection = goalProjection(goal, data, today);
        const targetYearPassed = goal.year < Number(today.slice(0, 4)) && pct < 100;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${goal.name}, target ${formatAmount(target, 'exact', 1)}, ${goal.year}, ${pct.toFixed(1)}% funded`}
            accessibilityHint="Opens this goal for editing"
            onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
            style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.goalTop}>
              <View style={styles.goalNameBlock}>
                <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Target <AmountText value={target} tier="row" /> · {goal.year}</AppText>
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
              <AppText style={[typography.meta, { color: colors.ok }]}><AmountText value={saved} tier="row" /> saved</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}><AmountText value={Math.max(0, target - saved)} tier="row" /> left</AppText>
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
                <AppText style={[typography.meta, styles.goalMinimum, { color: colors.text3 }]}>
                  Minimum 3 months of expenses: <AmountText value={minimum ?? 0} tier="row" />
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
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
  monthBudgetCard: { gap: 8 },
  categoryBreakdown: { gap: 4 },
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
