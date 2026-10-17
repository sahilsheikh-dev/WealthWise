import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { AppText, Button, Card, EmptyState, ProgressBar, Screen } from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { emergencyFundBaseline, monthsCovered } from '../src/domain/ef';
import {
  allocateAmounts,
  activeEfBucketMetadata,
  resolveEfAllocation,
} from '../src/domain/efAllocation';
import { goalSavedFor } from '../src/domain/goalLinks';
import { effectiveEmergencyTarget, ensureEfGoal } from '../src/domain/goals';
import { holdingValue } from '../src/domain/portfolio';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function EmergencyFundScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const baseline = emergencyFundBaseline(data.transactions, data.settings.monthlySalary, asOf);
  const base = baseline.amount;
  const emergencyGoal = ensureEfGoal(data.goals, { expenseBaseline: base, asOf })
    .find((goal) => goal.auto === 'ef');
  if (!emergencyGoal) throw new Error('Emergency fund goal is missing.');

  const balance = goalSavedFor(emergencyGoal, data, asOf);
  const covered = monthsCovered(balance, base);
  const target = effectiveEmergencyTarget(emergencyGoal, base);
  const { allocation, repaired } = resolveEfAllocation(data);
  const targetAmounts = allocateAmounts(balance, allocation, data.efCustomBuckets);
  const links = emergencyGoal.links;
  const hasLinkedAssets = links.some((link) =>
    data.holdings.some((holding) => holding.id === link.instrumentId));
  const bucketRows = activeEfBucketMetadata(allocation, data.efCustomBuckets, data.efBucketLinks).map((bucket) => {
    const holdings = (data.efBucketLinks[bucket.id] ?? []).flatMap((id) => {
      const holding = data.holdings.find((item) => item.id === id);
      const link = links.find((item) => item.instrumentId === id);
      return holding && link ? [{ holding, link }] : [];
    });
    const actual = holdings.reduce((sum, item) => sum + holdingValue(item.holding, asOf) * item.link.share / 100, 0);
    const planned = targetAmounts[bucket.id] ?? 0;
    return {
      bucket,
      targetPct: allocation[bucket.id] ?? 0,
      planned,
      actual,
      percent: planned > 0 ? Math.min(100, actual / planned * 100) : actual > 0 ? 100 : 0,
    };
  });
  const openGoalEditor = () => router.push({ pathname: '/goal-form', params: { id: emergencyGoal.id } });

  return (
    <Screen>
      <AppHeader
        title="Emergency fund"
        showBack
        fallbackHref="/(tabs)"
        showDefaultMenu={false}
        rightActions={[{
          icon: 'edit-2',
          label: 'Edit allocation',
          onPress: () => router.push('/ef-allocation-form'),
        }]}
      />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Current value</AppText>
        <AmountText value={balance} tier="hero" tone="primary" weight="bold" style={[typography.big, styles.amount]} />
        <View style={styles.summaryLine}>
          <AppText style={[typography.meta, { color: colors.text2 }]}>Target</AppText>
          <AmountText value={target.target} tier="row" weight="semibold" />
        </View>
        <ProgressBar percent={target.target > 0 ? Math.min(100, balance / target.target * 100) : 0} />
        <View style={styles.summaryLine}>
          <AppText style={[typography.meta, { color: colors.text2 }]}>Months of cover</AppText>
          <AppText weight="semibold">{covered === null ? '—' : `${Math.trunc(covered * 10) / 10} mo`}</AppText>
        </View>
        <AppText
          style={[typography.meta, { color: colors.text3 }]}
          accessibilityLabel={baseline.source === 'expenses'
            ? `Based on your average monthly expenses, ${formatAmount(base, 'exact', 1)}`
            : baseline.source === 'salary'
              ? 'Based on your monthly income'
              : 'Add your monthly income to see cover'}>
          {baseline.source === 'expenses' ? 'Based on your average monthly expenses' : baseline.source === 'salary'
            ? 'Based on your monthly income'
            : 'Add your monthly income to see cover'}
        </AppText>
      </Card>

      <Card>
        <AppText weight="semibold" style={styles.allocationTitle}>Allocation</AppText>
        {repaired ? (
          <AppText style={[typography.meta, { color: colors.text2 }]}>
            Your allocation was adjusted to total 100%. Check it in Edit allocation.
          </AppText>
        ) : null}
        {!hasLinkedAssets ? (
          <View style={styles.emptyAllocation}>
            <EmptyState title="No assets linked" />
            <Button label="Link assets" icon="link" onPress={openGoalEditor} />
          </View>
        ) : null}
        {bucketRows.map(({ bucket, targetPct, planned, actual, percent }) => (
          <View
            key={bucket.id}
            testID={`emergency-fund-allocation-item-${bucket.id}`}
            style={[styles.bucketRow, { borderBottomColor: colors.border }]}>
            <View style={styles.bucketHeader}>
              <AppText weight="semibold" style={styles.bucketName}>{bucket.label}</AppText>
            </View>
            <View style={styles.amountLine}>
              <AppText style={[typography.meta, { color: colors.text3 }]}>Available amount</AppText>
              <AmountText value={actual} tier="row" weight="semibold" />
            </View>
            <View style={styles.amountLine}>
              <AppText style={[typography.meta, { color: colors.text3 }]}>Target amount</AppText>
              <AmountText value={planned} tier="row" />
            </View>
            <AppText style={[typography.meta, { color: colors.text3 }]}>Target {targetPct}%</AppText>
            <View testID={`emergency-fund-progress-${bucket.id}`} style={styles.progressBar}>
              <ProgressBar percent={percent} />
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amount: { marginTop: 5 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  allocationTitle: { marginBottom: 8 },
  bucketRow: { gap: 5, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketName: { flex: 1 },
  amountLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  progressBar: { width: '100%' },
  emptyAllocation: { gap: 8 },
});
