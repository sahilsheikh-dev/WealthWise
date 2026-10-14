import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { CardHeaderRow } from '../src/components/CardHeaderRow';
import { ListRow as SharedListRow } from '../src/components/ListRow';
import { SectionHeaderRow } from '../src/components/SectionHeaderRow';
import { SortChip } from '../src/components/SortChip';
import {
  AppText,
  Button,
  Card,
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
  EF_BUCKET_META,
  allocateAmounts,
  allocationWarnings,
  effectiveAllocation,
} from '../src/domain/efAllocation';
import { ensureEfGoal, goalView } from '../src/domain/goals';
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
  const allocation = effectiveAllocation(data.efAllocation);
  const allocationAmounts = allocateAmounts(balance, allocation);
  const allocationAlerts = allocationWarnings(allocation);
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
          {EF_BUCKETS.map((id) => (
            <View key={id} style={[styles.allocationRow, { borderBottomColor: colors.border }]}>
              <AppText style={[typography.meta, styles.allocationLabel]}>{EF_BUCKET_META[id].label}</AppText>
              <AppText style={typography.meta}>{allocation[id]}%</AppText>
              <AmountText value={allocationAmounts[id]} tier="row" style={[typography.meta, styles.allocationAmount]} />
            </View>
          ))}
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

        <SectionHeaderRow
          title="Emergency fund entries"
          right={<SortChip options={SORT_OPTIONS.emergencyFund} spec={sorting.spec} onChange={sorting.setSpec} />}
        />

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
  allocationRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  allocationLabel: { flex: 1 },
  allocationAmount: { minWidth: 100, textAlign: 'right' },
  basedOn: { marginTop: 8 },
  sortRow: { marginHorizontal: 20, marginTop: 8 },
  passbook: {  },
  passbookRow: { minHeight: 66, borderBottomWidth: StyleSheet.hairlineWidth },
  passbookContents: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDetails: { flex: 1, minWidth: 0, gap: 3 },
});
