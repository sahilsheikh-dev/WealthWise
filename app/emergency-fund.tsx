import { router } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { CardHeaderRow } from '../src/components/CardHeaderRow';
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
import type { GoalLink, Holding } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function EmergencyFundScreen() {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
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
  const linkedAssets = links.flatMap((link): { link: GoalLink; holding: Holding }[] => {
    const holding = data.holdings.find((item) => item.id === link.instrumentId);
    return holding ? [{ link, holding }] : [];
  });
  const bucketRows = activeEfBucketMetadata(allocation, data.efCustomBuckets, data.efBucketLinks).map((bucket) => {
    const holdings = (data.efBucketLinks[bucket.id] ?? []).flatMap((id) => {
      const holding = data.holdings.find((item) => item.id === id);
      const link = links.find((item) => item.instrumentId === id);
      return holding && link ? [{ holding, link }] : [];
    });
    const actual = holdings.reduce((sum, item) => sum + holdingValue(item.holding, asOf) * item.link.share / 100, 0);
    const planned = targetAmounts[bucket.id] ?? 0;
    const status = actual < planned - 0.005 ? 'Under' : actual > planned + 0.005 ? 'Over' : 'On target';
    return {
      bucket,
      targetPct: allocation[bucket.id] ?? 0,
      planned,
      actual,
      percent: planned > 0 ? Math.min(100, actual / planned * 100) : actual > 0 ? 100 : 0,
      status,
    };
  });
  const openGoalEditor = () => router.push({ pathname: '/goal-form', params: { id: emergencyGoal.id } });

  return (
    <Screen>
      <AppHeader title="Emergency fund" showBack fallbackHref="/(tabs)" showDefaultMenu={false} />
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
        <CardHeaderRow
          title={<AppText weight="semibold">Allocation</AppText>}
          editLabel="Edit emergency fund allocation"
          onEdit={() => router.push('/ef-allocation-form')}
        />
        {repaired ? (
          <AppText style={[typography.meta, { color: colors.text2 }]}>
            Your allocation was adjusted to total 100%. Check it in Edit allocation.
          </AppText>
        ) : null}
        {linkedAssets.length === 0 ? (
          <View style={styles.emptyAllocation}>
            <EmptyState title="No assets linked" />
            <Button label="Link assets" icon="link" onPress={openGoalEditor} />
          </View>
        ) : (
          <>
            {bucketRows.map(({ bucket, targetPct, planned, actual, percent, status }) => (
              <View key={bucket.id} style={[styles.bucketRow, { borderBottomColor: colors.border }]}>
                <View style={styles.bucketHeader}>
                  <AppText weight="semibold" style={styles.bucketName}>{bucket.label}</AppText>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>Target {targetPct}%</AppText>
                </View>
                <View style={styles.amountLine}>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>Target amount</AppText>
                  <AmountText value={planned} tier="row" />
                </View>
                <View style={styles.amountLine}>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>Available amount</AppText>
                  <AmountText value={actual} tier="row" weight="semibold" />
                </View>
                <View style={[
                  styles.progressStatusRow,
                  fontScale >= 1.3 && styles.progressStatusStacked,
                ]} testID={`emergency-fund-progress-status-${bucket.id}`}>
                  <View testID={`emergency-fund-progress-${bucket.id}`} style={styles.progressBar}>
                    <ProgressBar percent={percent} />
                  </View>
                  <AppText style={[
                    typography.meta,
                    styles.progressStatus,
                    fontScale >= 1.3 && styles.progressStatusRight,
                    { color: status === 'On target' ? colors.ok : colors.text2 },
                  ]} testID={`emergency-fund-status-${bucket.id}`}>
                    {status}
                  </AppText>
                </View>
              </View>
            ))}
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amount: { marginTop: 5 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  bucketRow: { gap: 5, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketName: { flex: 1 },
  amountLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  progressStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressStatusStacked: { flexDirection: 'column', alignItems: 'stretch' },
  progressStatus: { flexShrink: 0 },
  progressStatusRight: { alignSelf: 'flex-end', textAlign: 'right' },
  progressBar: { flex: 1, minWidth: 0 },
  emptyAllocation: { gap: 8 },
});
