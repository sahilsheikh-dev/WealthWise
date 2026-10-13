import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../src/components/AppHeader';
import { AmountText } from '../../src/components/AmountText';
import { SortChip } from '../../src/components/SortChip';
import { SectionHeaderRow } from '../../src/components/SectionHeaderRow';
import { AppText, Card, ProgressBar, Screen } from '../../src/components/ui';
import { useAppData } from '../../src/data/useAppData';
import { useSort } from '../../src/data/useSort';
import { efBalance, monthlyBaseline } from '../../src/domain/ef';
import { goalProjection } from '../../src/domain/goalLinks';
import { ensureEfGoal, goalTotals, goalView } from '../../src/domain/goals';
import { todayISO } from '../../src/lib/clock';
import { formatDate } from '../../src/lib/format';
import { formatAmount } from '../../src/lib/amountDisplay';
import { SORT_OPTIONS } from '../../src/lib/sorting';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const sorting = useSort('goals');
  const asOf = todayISO();
  const emergencyBalance = efBalance(data.efEntries);
  const expenseBaseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const goals = ensureEfGoal(data.goals, {
    expenseBaseline,
    asOf,
  });
  const totals = goalTotals(goals, emergencyBalance, expenseBaseline, data, asOf);
  const goalCreationOrder = new Map(data.goals.map((goal, index) => [goal.id, index]));
  const sortedGoals = sorting.sort(goals.map((goal) => {
    const view = goalView(goal, { emergencyBalance, expenseBaseline, data, asOf });
    return {
      ...goal,
      targetAmount: view.target,
      progress: view.pct,
      remaining: Math.max(0, view.target - view.saved),
      sortCreatedIndex: goalCreationOrder.get(goal.id) ?? data.goals.length,
    };
  }));

  return (
    <Screen>
      <AppHeader title="Goals" rightActions={[{ icon: 'plus', label: 'New goal', onPress: () => router.push('/goal-form') }]} />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Total target</AppText>
        <AmountText value={totals.target} tier="hero" weight="bold" style={[typography.big, styles.total]} />
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          <AmountText value={totals.saved} tier="row" /> saved, {totals.pct.toFixed(2)}% funded
        </AppText>
        <ProgressBar percent={totals.pct} />
      </Card>
      <SectionHeaderRow
        title="Active Goals"
        right={<SortChip options={SORT_OPTIONS.goals} spec={sorting.spec} onChange={sorting.setSpec} />}
      />
      {sortedGoals.map((goal) => {
        const view = goalView(goal, { emergencyBalance, expenseBaseline, data, asOf });
        const projection = goalProjection(goal, data, asOf);
        const { target, saved, pct: goalPercent } = view;
        const targetYearPassed = goal.year < Number(asOf.slice(0, 4)) && goalPercent < 100;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${goal.name}, target ${formatAmount(target, 'exact', 1)}, ${goal.year}, ${goalPercent.toFixed(1)}% funded`}
            accessibilityHint="Opens this goal for editing"
            onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
            style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.goalHeader}>
              <View style={styles.nameBlock}>
                <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Target <AmountText value={target} tier="row" /> · {goal.year}{goal.auto ? ' · Synced from Emergency fund' : ''}
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
              <AppText weight="bold" style={[styles.percentage, { color: colors.primary }]}>{goalPercent.toFixed(1)}%</AppText>
            </View>
            <ProgressBar percent={goalPercent} />
            <View style={styles.amounts}>
              <AppText style={[typography.meta, { color: colors.ok }]}><AmountText value={saved} tier="row" /> saved</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}><AmountText value={Math.max(0, target - saved)} tier="row" /> left</AppText>
            </View>
            {goal.auto !== 'ef' ? (
              <View style={styles.projection}>
                <AppText style={[typography.meta, { color: colors.text2 }]}>
                  {projection.projectedDate === 'Already reached'
                    ? 'Already reached'
                    : projection.projectedDate
                      ? `Projected completion ${formatDate(projection.projectedDate)}`
                      : 'Not reachable with current contributions'}
                </AppText>
                {projection.status !== 'none' ? (
                  <AppText style={[typography.meta, { color: projection.status === 'behind' ? colors.err : colors.primary }]}>
                    {projection.status === 'on-track'
                      ? 'On track'
                      : projection.status === 'ahead'
                        ? 'Ahead'
                        : 'Behind'}
                  </AppText>
                ) : null}
              </View>
            ) : null}
            {goal.auto === 'ef' ? (
              <>
                <AppText style={[typography.meta, styles.minimum, { color: colors.text3 }]}>
                  Minimum 3 months of expenses: <AmountText value={view.minimum ?? 0} tier="row" />
                </AppText>
                {expenseBaseline > 0 ? (
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    Based on an average of <AmountText value={expenseBaseline} tier="row" /> monthly expenses
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
  projection: { marginTop: 8, gap: 3 },
  minimum: { marginTop: 7 },
  sortRow: { marginHorizontal: 20, marginVertical: 8 },
});
