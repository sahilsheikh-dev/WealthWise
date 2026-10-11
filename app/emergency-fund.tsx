import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { IconButton } from '../src/components/IconButton';
import {
  AppText,
  Card,
  DetailTabBar,
  ProgressBar,
  Screen,
  SectionTitle,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { efBalance, efPassbook, milestones, monthlyBaseline, monthsCovered } from '../src/domain/ef';
import { ensureEfGoal, goalView } from '../src/domain/goals';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function EmergencyFundScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const balance = efBalance(data.efEntries);
  const baseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const covered = monthsCovered(balance, baseline);
  const fundMilestones = milestones(balance, baseline);
  const entries = efPassbook(data.efEntries);
  const emergencyGoal = ensureEfGoal(data.goals, { expenseBaseline: baseline, asOf })
    .find((goal) => goal.auto === 'ef');
  const emergencyGoalView = emergencyGoal ? goalView(emergencyGoal, {
    emergencyBalance: balance,
    expenseBaseline: baseline,
  }) : null;

  return (
    <>
      <Screen bottomPadding={120}>
        <AppHeader
          title="Emergency fund"
          showBack
          fallbackHref="/(tabs)"
          rightActions={[{ icon: 'plus', label: 'Log Emergency fund entry', onPress: () => router.push('/ef-entry-form') }]}
        />
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Current balance</AppText>
          <AppText weight="bold" style={[typography.big, styles.balance]}>{formatINR(balance)}</AppText>
          {baseline > 0 && covered !== null ? (
            <AppText style={[typography.meta, { color: colors.primary }]}>
              {covered.toFixed(1)} months of expenses covered
            </AppText>
          ) : (
            <AppText style={[typography.meta, { color: colors.text3 }]}>Log expenses to see months covered</AppText>
          )}
          <StatPillRow>
            {fundMilestones.map((milestone) => {
              return (
                <StatPill
                  key={milestone.months}
                  label={`${milestone.months} mo`}
                  value={milestone.done ? 'Met' : `${Math.round(milestone.pct)}%`}
                  tone={milestone.done ? 'ok' : 'primary'}
                />
              );
            })}
          </StatPillRow>
          {baseline > 0 ? (
            <AppText style={[typography.meta, styles.basedOn, { color: colors.text3 }]}>
              Based on an average of {formatINR(baseline)} monthly expenses.
            </AppText>
          ) : null}
        </Card>

        {emergencyGoal && emergencyGoalView ? (
          <Card>
            <View style={styles.targetHeader}>
              <View style={styles.targetTitle}>
                <AppText style={[typography.label, { color: colors.text3 }]}>Emergency fund target</AppText>
                <AppText weight="bold" style={[typography.big, styles.targetAmount]}>{formatINR(emergencyGoalView.target)}</AppText>
              </View>
              <IconButton
                icon="edit-2"
                label="Edit emergency fund target"
                onPress={() => router.push({ pathname: '/goal-form', params: { id: emergencyGoal.id } })}
              />
            </View>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              Minimum (3 months of expenses): {formatINR(emergencyGoalView.minimum ?? 0)}
            </AppText>
            {baseline > 0 ? (
              <AppText style={[typography.meta, { color: colors.text3 }]}>
                Based on an average of {formatINR(baseline)} monthly expenses
              </AppText>
            ) : (
              <AppText style={[typography.meta, { color: colors.text3 }]}>Add expenses to calculate your 3-month minimum</AppText>
            )}
            <ProgressBar percent={emergencyGoalView.pct} />
            <AppText style={[typography.meta, { color: colors.text2, marginTop: 5 }]}>
              {balance >= emergencyGoalView.target
                ? 'Target reached'
                : `${formatINR(Math.max(0, emergencyGoalView.target - balance))} to go`}
            </AppText>
            {emergencyGoalView.raised ? (
              <AppText style={[typography.meta, { color: colors.text3 }]}>Raised to the 3-month minimum</AppText>
            ) : null}
          </Card>
        ) : null}

        <SectionTitle>Passbook</SectionTitle>
        <View style={styles.passbook}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${entry.amount < 0 ? 'withdrawal' : 'deposit'} ${formatINR(Math.abs(entry.amount))} from ${formatDate(entry.date)}`}
              onPress={() => router.push({ pathname: '/ef-entry-form', params: { id: entry.id } })}
              style={[styles.passbookRow, { borderBottomColor: colors.border }]}>
              <View style={styles.entryDetails}>
                <AppText weight="bold" style={[typography.amount, { color: entry.amount < 0 ? colors.err : colors.ok }]}>
                  {entry.amount < 0 ? '-' : '+'}{formatINR(Math.abs(entry.amount))}
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>{formatDate(entry.date)} · {entry.note}</AppText>
              </View>
              <AppText weight="bold" style={typography.amount}>{formatINR(entry.balance)}</AppText>
            </Pressable>
          ))}
        </View>
      </Screen>
      <DetailTabBar active="Home" />
    </>
  );
}

const styles = StyleSheet.create({
  balance: { marginTop: 5 },
  targetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  targetTitle: { flex: 1, gap: 4 },
  targetAmount: { marginTop: 2 },
  basedOn: { marginTop: 8 },
  passbook: { marginHorizontal: 20 },
  passbookRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  entryDetails: { flex: 1, minWidth: 0, gap: 3 },
});
