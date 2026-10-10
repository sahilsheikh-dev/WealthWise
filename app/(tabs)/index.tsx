import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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
import { AppHeader } from '../../src/components/AppHeader';
import { createMetaStore, type BackupMeta } from '../../src/data/metaStore';
import { useAppStore } from '../../src/data/store';
import { useAppData } from '../../src/data/useAppData';
import { shouldNudge } from '../../src/domain/backupNudge';
import { addDays } from '../../src/domain/dates';
import { findUnlinkedEntries } from '../../src/domain/instruments';
import { homeSummary } from '../../src/domain/summary';
import { upcomingDue } from '../../src/domain/schedule';
import { currentHour, todayISO } from '../../src/lib/clock';
import { choiceAsync } from '../../src/lib/confirm';
import { formatDate, formatINR, formatINRShort } from '../../src/lib/format';
import { greetingFor } from '../../src/lib/greeting';
import { buildHomeMenu } from '../../src/lib/homeMenu';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const actions = [
  { label: 'Add Txn', icon: 'plus-circle' as const },
  { label: 'New investment', icon: 'repeat' as const },
  { label: 'New liability', icon: 'credit-card' as const },
  { label: 'Log EF', icon: 'shield' as const },
];
const metaStore = createMetaStore(AsyncStorage);

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function HomeScreen() {
  const { colors, themeId } = useTheme();
  const data = useAppData();
  const devActions = useAppStore((state) => state.devActions);
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
  const themeLabels = {
    system: 'System', light: 'Light', dark: 'Dark', sky: 'Sky', mint: 'Mint', blush: 'Blush', midnight: 'Midnight',
  } as const;
  const menu = buildHomeMenu({
    hasUnlinked: findUnlinkedEntries(data).length > 0,
    isDev: __DEV__,
    themeLabel: themeLabels[themeId],
  }).map((item) => ({
    ...item,
    onPress: () => {
      if (item.label === 'Backup and restore') router.push('/backup');
      else if (item.label === 'Security') router.push('/security');
      else if (item.label === 'Profile') router.push('/profile-form' as Href);
      else if (item.label === 'Theme') router.push('/theme' as Href);
      else if (item.label === 'Link missing transactions') router.push('/link-missing' as Href);
      else if (item.label === 'Erase all data') router.push('/erase-data');
      else if (item.label === 'Load demo data' && devActions) {
        void choiceAsync({
          title: 'Load Demo Data?',
          message: 'Replace local app data with the bundled sample data?',
          choices: [{ id: 'load', label: 'Load Demo Data' }],
        }).then((choice) => { if (choice === 'load') devActions.loadDemoData(); });
      } else if (item.label === 'Simulate corrupt storage' && devActions) {
        void choiceAsync({
          title: 'Simulate Corrupt Storage?',
          message: 'The app will restart and show its recovery screen.',
          choices: [{ id: 'continue', label: 'Continue', destructive: true }],
        }).then((choice) => { if (choice === 'continue') void devActions.simulateCorruption(); });
      }
    },
  }));
  return (
    <Screen>
      <AppHeader title={`${greetingFor(currentHour())}, ${data.settings.name || 'Welcome'}`} menu={menu} />
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
            <Button label="Export now" variant="primary" onPress={() => router.push('/backup')} />
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
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              if (action.label === 'Add Txn') {
                router.push('/transaction-form');
                return;
              }
              if (action.label === 'New investment') {
                router.push('/investment-form' as Href);
                return;
              }
              if (action.label === 'New liability') {
                router.push('/liability-form');
                return;
              }
              router.push('/ef-entry-form');
            }}
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name={action.icon} size={17} color={colors.primary} />
            <AppText weight="semibold" style={[styles.actionLabel, { color: colors.text2 }]}>{action.label}</AppText>
          </Pressable>
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
      {summary.goals.slice(0, 3).map(({ goal, saved, pct }) => {
        const targetYearPassed = goal.year < Number(today.slice(0, 4)) && pct < 100;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${goal.name}`}
            onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
            style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.goalTop}>
              <View style={styles.goalNameBlock}>
                <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Target {goal.year}</AppText>
                {targetYearPassed ? (
                  <AppText style={[typography.meta, { color: colors.err }]}>Target year has passed</AppText>
                ) : null}
              </View>
              <AppText weight="bold" style={[styles.goalPercent, { color: colors.primary }]}>{pct.toFixed(1)}%</AppText>
            </View>
            <ProgressBar percent={pct} />
            <View style={styles.goalAmounts}>
              <AppText style={[typography.meta, { color: colors.ok }]}>{formatINRShort(saved)} saved</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{formatINRShort(Math.max(0, goal.target - saved))} left</AppText>
            </View>
          </Pressable>
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
  quickAction: { minHeight: 76, flex: 1, minWidth: 0, paddingHorizontal: 4, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionLabel: { fontSize: 10, textAlign: 'center' },
  goal: { marginHorizontal: 20, marginBottom: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goalNameBlock: { flex: 1, minWidth: 0, gap: 3 },
  goalPercent: { fontSize: 12 },
  goalAmounts: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
