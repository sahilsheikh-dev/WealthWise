import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { CardHeaderRow } from '../src/components/CardHeaderRow';
import { ListRow as SharedListRow } from '../src/components/ListRow';
import { SortChip } from '../src/components/SortChip';
import {
  AppText,
  Button,
  Card,
  ChipRow,
  DetailTabBar,
  ProgressBar,
  Screen,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { efBalance, efPassbook, milestones, monthlyBaseline, monthsCovered } from '../src/domain/ef';
import {
  EF_BUCKETS,
  allocateAmounts,
  allocationWarnings,
  efBucketMetadata,
  effectiveAllocation,
} from '../src/domain/efAllocation';
import { ensureEfGoal, goalView } from '../src/domain/goals';
import { holdingValue } from '../src/domain/portfolio';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatDate } from '../src/lib/format';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function EmergencyFundScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const sorting = useSort('emergencyFund');
  const asOf = todayISO();
  const balance = efBalance(data.efEntries);
  const baseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const covered = monthsCovered(balance, baseline);
  const fundMilestones = milestones(balance, baseline);
  const entries = sorting.sort(efPassbook(data.efEntries));
  const allocation = effectiveAllocation(data.efAllocation, data.efCustomBuckets);
  const allocationAmounts = allocateAmounts(balance, allocation, data.efCustomBuckets);
  const allocationAlerts = allocationWarnings(allocation, data.efCustomBuckets);
  const allocationRows = efBucketMetadata(data.efCustomBuckets).map((bucket) => {
    const linkedHoldings = (data.efBucketLinks[bucket.id] ?? [])
      .map((holdingId) => data.holdings.find((holding) => holding.id === holdingId))
      .filter((holding) => holding !== undefined);
    return {
      bucket,
      isCustom: !EF_BUCKETS.some((fixedId) => fixedId === bucket.id),
      linkedHoldings,
      linkedValue: linkedHoldings.reduce((sum, holding) => sum + holdingValue(holding, asOf), 0),
      planned: allocationAmounts[bucket.id] ?? 0,
    };
  });
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
          <AmountText value={balance} tier="hero" tone="primary" weight="bold" style={[typography.big, styles.balance]} />
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
            <AppText
              style={[typography.meta, styles.basedOn, { color: colors.text3 }]}
              accessibilityLabel={`Based on an average of ${formatAmount(baseline, 'exact', 1)} monthly expenses.`}>
              Based on an average of <AmountText value={baseline} tier="row" /> monthly expenses.
            </AppText>
          ) : null}
        </Card>

        <Card>
          <View style={styles.allocationHeading}>
            <View style={styles.allocationTitle}>
              <AppText weight="semibold" style={typography.name}>Emergency fund allocation</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>
                {data.efAllocation ? 'Custom allocation' : 'Suggested mix'}
              </AppText>
            </View>
            <Button
              label="Edit allocation"
              icon="sliders"
              onPress={() => router.push('/ef-allocation-form' as Href)}
            />
          </View>
          {allocationRows.map(({ bucket, isCustom, linkedHoldings, linkedValue, planned }) => (
            <View
              key={bucket.id}
              style={[
                isCustom ? styles.customAllocationRow : styles.fixedAllocationContainer,
                { borderBottomColor: colors.border },
              ]}>
              <View style={styles.allocationRow}>
                <AppText style={[typography.meta, styles.allocationLabel]}>{bucket.label}</AppText>
                <AppText style={typography.meta}>{allocation[bucket.id] ?? 0}%</AppText>
                <AmountText value={planned} tier="row" style={[typography.meta, styles.allocationAmount]} />
              </View>
              {isCustom || linkedHoldings.length > 0 ? (
                <>
                  <View style={styles.linkedInvestmentChips}>
                    {linkedHoldings.map((holding) => {
                      const value = holdingValue(holding, asOf);
                      return (
                        <View
                          key={holding.id}
                          accessible
                          accessibilityLabel={`${holding.name}: ${formatAmount(value, 'exact', 1)}`}
                          style={[styles.linkedInvestmentChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                          <AppText style={typography.chip}>{holding.name}</AppText>
                          <AmountText value={value} tier="row" style={typography.chip} />
                        </View>
                      );
                    })}
                  </View>
                  <AppText
                    style={[typography.meta, { color: colors.text3 }]}
                    accessibilityLabel={`Linked ${formatAmount(linkedValue, 'exact', 1)} of ${formatAmount(planned, 'exact', 1)} planned`}>
                    Linked <AmountText value={linkedValue} tier="row" /> of <AmountText value={planned} tier="row" /> planned
                  </AppText>
                </>
              ) : null}
            </View>
          ))}
          {data.efCustomBuckets.length > 0 || Object.values(data.efBucketLinks).some((holdingIds) => holdingIds.length > 0) ? (
            <AppText style={[typography.meta, { color: colors.text3, marginTop: 8 }]}>
              Linking does not move money or change your net worth. Do not record the same money as both an emergency fund balance and an investment.
            </AppText>
          ) : null}
          {allocationAlerts.map((warning) => (
            <AppText key={warning.id} style={[typography.meta, { color: colors.err, marginTop: 6 }]}>
              {warning.message}
            </AppText>
          ))}
        </Card>

        {emergencyGoal && emergencyGoalView ? (
          <Card>
            <CardHeaderRow
              title={<AppText style={[typography.label, { color: colors.text3 }]}>Emergency fund target</AppText>}
              value={<AmountText value={emergencyGoalView.target} tier="hero" tone="primary" weight="bold" style={[typography.big, styles.targetAmount]} />}
              editLabel="Edit emergency fund target"
              onEdit={() => router.push({ pathname: '/goal-form', params: { id: emergencyGoal.id } })}
            />
            <AppText
              style={[typography.meta, { color: colors.text3 }]}
              accessibilityLabel={`Minimum (3 months of expenses): ${formatAmount(emergencyGoalView.minimum ?? 0, 'exact', 1)}`}>
              Minimum (3 months of expenses): <AmountText value={emergencyGoalView.minimum ?? 0} tier="row" />
            </AppText>
            {baseline > 0 ? (
              <AppText
                style={[typography.meta, { color: colors.text3 }]}
                accessibilityLabel={`Based on an average of ${formatAmount(baseline, 'exact', 1)} monthly expenses`}>
                Based on an average of <AmountText value={baseline} tier="row" /> monthly expenses
              </AppText>
            ) : (
              <AppText style={[typography.meta, { color: colors.text3 }]}>Add expenses to calculate your 3-month minimum</AppText>
            )}
            <ProgressBar percent={emergencyGoalView.pct} />
            <AppText
              style={[typography.meta, { color: colors.text2, marginTop: 5 }]}
              accessibilityLabel={balance >= emergencyGoalView.target
                ? 'Target reached'
                : `${formatAmount(Math.max(0, emergencyGoalView.target - balance), 'exact', 1)} to go`}>
              {balance >= emergencyGoalView.target
                ? 'Target reached'
                : <><AmountText value={Math.max(0, emergencyGoalView.target - balance)} tier="row" /> to go</>}
            </AppText>
            {emergencyGoalView.raised ? (
              <AppText style={[typography.meta, { color: colors.text3 }]}>Raised to the 3-month minimum</AppText>
            ) : null}
          </Card>
        ) : null}

        <ChipRow>
          <SortChip options={SORT_OPTIONS.emergencyFund} spec={sorting.spec} onChange={sorting.setSpec} />
        </ChipRow>

        <View style={styles.passbook}>
          {entries.map((entry) => (
            <Card key={entry.id}>
            <SharedListRow
              key={entry.id}
              style={[styles.passbookRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: '/ef-entry-form', params: { id: entry.id } })}
              onEdit={() => router.push({ pathname: '/ef-entry-form', params: { id: entry.id } })}
              editLabel={`Edit emergency fund entry from ${formatDate(entry.date)}`}
              accessibilityLabel={`Edit ${entry.amount < 0 ? 'withdrawal' : 'deposit'} ${formatAmount(Math.abs(entry.amount), 'exact', 1)} from ${formatDate(entry.date)}`}
            >
              <View style={styles.passbookContents}>
                <View style={styles.entryDetails}>
                  <AppText
                    weight="bold"
                    style={[typography.amount, { color: entry.amount < 0 ? colors.err : colors.ok }]}
                    accessibilityLabel={`${entry.amount < 0 ? 'Withdrawal' : 'Deposit'} ${formatAmount(Math.abs(entry.amount), 'exact', 1)}`}>
                    {entry.amount < 0 ? '-' : '+'}<AmountText value={Math.abs(entry.amount)} tier="row" />
                  </AppText>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>{formatDate(entry.date)} · {entry.note}</AppText>
                </View>
                <AmountText value={entry.balance} tier="row" weight="bold" style={typography.amount} />
              </View>
            </SharedListRow>
            </Card>
          ))}
        </View>
      </Screen>
      <DetailTabBar active="Home" />
    </>
  );
}

const styles = StyleSheet.create({
  balance: { marginTop: 5 },
  targetAmount: { marginTop: 2 },
  allocationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  allocationTitle: { flex: 1, minWidth: 0, gap: 3 },
  allocationRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center' },
  fixedAllocationContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  customAllocationRow: { gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  allocationLabel: { flex: 1 },
  allocationAmount: { minWidth: 100, textAlign: 'right' },
  linkedInvestmentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linkedInvestmentChip: { minHeight: 34, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16 },
  basedOn: { marginTop: 8 },
  sortRow: { marginHorizontal: 20, marginTop: 8 },
  passbook: {  },
  passbookRow: { minHeight: 66, borderBottomWidth: StyleSheet.hairlineWidth },
  passbookContents: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDetails: { flex: 1, minWidth: 0, gap: 3 },
});
