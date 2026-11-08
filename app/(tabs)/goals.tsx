import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../src/components/AppHeader';
import { AppText, Card, ProgressBar, Screen, SectionTitle } from '../../src/components/ui';
import { useAppData } from '../../src/data/useAppData';
import { efBalance, monthlyBaseline } from '../../src/domain/ef';
import { ensureEfGoal, goalTotals, goalView } from '../../src/domain/goals';
import { todayISO } from '../../src/lib/clock';
import { formatINRShort } from '../../src/lib/format';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const emergencyBalance = efBalance(data.efEntries);
  const expenseBaseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const goals = ensureEfGoal(data.goals, {
    expenseBaseline,
    asOf,
  });
  const totals = goalTotals(goals, emergencyBalance, expenseBaseline);

  return (
    <Screen>
      <AppHeader title="Goals" rightActions={[{ icon: 'plus', label: 'New goal', onPress: () => router.push('/goal-form') }]} />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Total target</AppText>
        <AppText weight="bold" style={[typography.big, styles.total]}>{formatINRShort(totals.target)}</AppText>
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          {formatINRShort(totals.saved)} saved, {totals.pct.toFixed(2)}% funded
        </AppText>
        <ProgressBar percent={totals.pct} />
      </Card>
      <SectionTitle>Active Goals</SectionTitle>
      {goals.map((goal) => {
        const view = goalView(goal, { emergencyBalance, expenseBaseline });
        const { target, saved, pct: goalPercent } = view;
        const targetYearPassed = goal.year < Number(asOf.slice(0, 4)) && goalPercent < 100;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${goal.name}, target ${formatINRShort(target)}, ${goal.year}, ${goalPercent.toFixed(1)}% funded`}
            accessibilityHint="Opens this goal for editing"
            onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
            style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.goalHeader}>
              <View style={styles.nameBlock}>
                <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Target {formatINRShort(target)} · {goal.year}{goal.auto ? ' · Synced from Emergency fund' : ''}
                </AppText>
                {targetYearPassed ? (
                  <AppText style={[typography.meta, { color: colors.err }]}>Target year has passed</AppText>
                ) : null}
              </View>
              <AppText weight="bold" style={[styles.percentage, { color: colors.primary }]}>{goalPercent.toFixed(1)}%</AppText>
            </View>
            <ProgressBar percent={goalPercent} />
            <View style={styles.amounts}>
              <AppText style={[typography.meta, { color: colors.ok }]}>{formatINRShort(saved)} saved</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{formatINRShort(Math.max(0, target - saved))} left</AppText>
            </View>
            {goal.auto === 'ef' ? (
              <>
                <AppText style={[typography.meta, styles.minimum, { color: colors.text3 }]}>
                  Minimum 3 months of expenses: {formatINRShort(view.minimum ?? 0)}
                </AppText>
                {expenseBaseline > 0 ? (
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    Based on an average of {formatINRShort(expenseBaseline)} monthly expenses
                  </AppText>
                ) : <AppText style={[typography.meta, { color: colors.text3 }]}>Add expenses to calculate your 3-month minimum</AppText>}
                {view.raised ? (
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
  headerButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 11 },
  total: { marginTop: 5, marginBottom: 4 },
  goal: { marginHorizontal: 20, marginBottom: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameBlock: { flex: 1, minWidth: 0, gap: 3 },
  percentage: { fontSize: 12 },
  amounts: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  minimum: { marginTop: 7 },
});
