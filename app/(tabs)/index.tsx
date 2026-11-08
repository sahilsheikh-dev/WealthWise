import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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
  StatusBadge,
} from '../../src/components/ui';
import { createMetaStore, type BackupMeta } from '../../src/data/metaStore';
import { useAppData } from '../../src/data/useAppData';
import { shouldNudge } from '../../src/domain/backupNudge';
import { addDays } from '../../src/domain/dates';
import { upcomingDue } from '../../src/domain/schedule';
import { homeSummary } from '../../src/domain/summary';
import { currentHour, todayISO } from '../../src/lib/clock';
import { formatDate, formatINR, formatINRShort } from '../../src/lib/format';
import { greetingFor } from '../../src/lib/greeting';
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
  const dueItems = upcomingDue(data, today, 5);
  const [backupMeta, setBackupMeta] = useState<BackupMeta>({});
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
  return (
    <Screen>
      <AppHeader title={`${greetingFor(currentHour())}, ${data.settings.name || 'Welcome'}`} />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Net Worth</AppText>
        <AppText weight="bold" style={[typography.big, styles.netWorth]}>{formatINR(summary.netWorth)}</AppText>
        <StatPillRow>
          <StatPill label="Assets" value={formatINRShort(summary.assets)} tone="ok" onPress={() => router.push('/assets' as Href)} />
          <StatPill label="Liabilities" value={formatINRShort(summary.liabilities)} tone="err" onPress={() => router.push('/liabilities')} />
          <StatPill
            label="Emergency Fund"
            value={summary.emergencyMonths === null ? '—' : `${summary.emergencyMonths.toFixed(1)} mo`}
            tone="primary"
            onPress={() => router.push('/emergency-fund')}
          />
        </StatPillRow>
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
                accessibilityLabel={`${item.name}, ${item.row.status}, ${formatINR(item.row.amount)}`}
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
                  <AppText weight="semibold" style={typography.meta}>{formatINR(item.row.amount)}</AppText>
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
        const targetYearPassed = goal.year < Number(today.slice(0, 4)) && pct < 100;
        return (
          <View key={goal.id} style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.goalTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${goal.name}`}
                onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
                style={styles.goalNameBlock}>
                <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Target {formatINRShort(target)} · {goal.year}</AppText>
                {targetYearPassed ? (
                  <AppText style={[typography.meta, { color: colors.err }]}>Target year has passed</AppText>
                ) : null}
              </Pressable>
              <AppText weight="bold" style={[styles.goalPercent, { color: colors.primary }]}>{pct.toFixed(1)}%</AppText>
            </View>
            <ProgressBar percent={pct} />
            <View style={styles.goalAmounts}>
              <AppText style={[typography.meta, { color: colors.ok }]}>{formatINRShort(saved)} saved</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{formatINRShort(Math.max(0, target - saved))} left</AppText>
            </View>
            {goal.auto === 'ef' ? (
              <>
                <AppText style={[typography.meta, styles.goalMinimum, { color: colors.text3 }]}>
                  Minimum 3 months of expenses: {formatINRShort(minimum ?? 0)}
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {summary.expenseBaseline <= 0
                    ? 'Add expenses to calculate your 3-month minimum'
                    : `Based on an average of ${formatINRShort(summary.expenseBaseline)} monthly expenses`}
                </AppText>
                {raised ? (
                  <AppText style={[typography.meta, { color: colors.text3 }]}>Raised to the 3-month minimum</AppText>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeHeader: { paddingHorizontal: 20, paddingTop: 16, gap: 2 },
  netWorth: { marginTop: 5 },
  backupCard: { gap: 10 },
  backupActions: { flexDirection: 'row', gap: 8 },
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
