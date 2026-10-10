import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText, Card, ProgressBar, Screen, ScreenHeader, SectionTitle } from '../../src/components/ui';
import { useAppData } from '../../src/data/useAppData';
import { efBalance, monthlyBaseline } from '../../src/domain/ef';
import { ensureEfGoal, goalProgressPct, goalSaved, goalTotals } from '../../src/domain/goals';
import { todayISO } from '../../src/lib/clock';
import { formatINRShort } from '../../src/lib/format';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const emergencyBalance = efBalance(data.efEntries);
  const goals = ensureEfGoal(data.goals, {
    expenseBaseline: monthlyBaseline(data.transactions, 'expense', asOf),
    asOf,
  });
  const totals = goalTotals(goals, emergencyBalance);

  return (
    <Screen>
      <ScreenHeader title="Goals" right={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New goal"
          onPress={() => router.push('/goal-form')}
          style={[styles.headerButton, { backgroundColor: colors.primaryDim }]}>
          <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>New goal</AppText>
        </Pressable>
      )} />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Total target</AppText>
        <AppText weight="bold" style={[typography.big, styles.total]}>{formatINRShort(totals.target)}</AppText>
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          {formatINRShort(totals.saved)} saved, {totals.pct.toFixed(2)}% funded
        </AppText>
        <ProgressBar percent={totals.pct} />
      </Card>
      <SectionTitle>Active goals</SectionTitle>
      {goals.map((goal) => {
        const saved = goalSaved(goal, emergencyBalance);
        const goalPercent = goalProgressPct(goal, saved);
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${goal.name}`}
            onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
            style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.goalHeader}>
              <View style={styles.nameBlock}>
                <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Target {goal.year}{goal.auto ? ' · Synced from Emergency fund' : ''}
                </AppText>
              </View>
              <AppText weight="bold" style={[styles.percentage, { color: colors.primary }]}>{goalPercent.toFixed(1)}%</AppText>
            </View>
            <ProgressBar percent={goalPercent} />
            <View style={styles.amounts}>
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
  headerButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 11 },
  total: { marginTop: 5, marginBottom: 4 },
  goal: { marginHorizontal: 20, marginBottom: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameBlock: { flex: 1, minWidth: 0, gap: 3 },
  percentage: { fontSize: 12 },
  amounts: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
