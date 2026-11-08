import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { CardHeaderRow } from '../src/components/CardHeaderRow';
import { DueActions } from '../src/components/DueActions';
import { SectionHeaderRow } from '../src/components/SectionHeaderRow';
import { SortChip } from '../src/components/SortChip';
import {
  ActionRow,
  AppText,
  Button,
  Card,
  DetailTabBar,
  EmptyState,
  ProgressBar,
  Screen,
  StatPill,
  StatPillRow,
  StatusBadge,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { liabilitySummary, payoffDate } from '../src/domain/liability';
import { liabilitySchedule } from '../src/domain/schedule';
import { liabilitiesOverview } from '../src/domain/summary';
import type { OneTimeLiability, RecurringLiability } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatMonth } from '../src/lib/format';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const EXTRA_ERROR = 'Enter a whole number between 0 and 10,00,000';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilitiesScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const sorting = useSort('liabilities');
  const asOf = todayISO();
  const [extraText, setExtraText] = useState('0');
  const hasRecurring = data.liabilities.some((liability) => liability.kind === 'recurring');
  const isValidExtra = /^\d+$/.test(extraText) && Number.isSafeInteger(Number(extraText))
    && Number(extraText) >= 0 && Number(extraText) <= 1_000_000;
  const extra = isValidExtra ? Number(extraText) : 0;
  const overview = liabilitiesOverview(data, asOf, extra);
  const liabilityCreationOrder = new Map(data.liabilities.map((liability, index) => [liability.id, index]));
  const sortedLiabilities = sorting.sort(data.liabilities.map((liability) => {
    const summary = liabilitySummary(liability, asOf);
    const schedule = liabilitySchedule(liability, asOf);
    return {
      ...liability,
      balance: summary.balance,
      sortEmi: liability.kind === 'recurring' ? liability.emi : null,
      nextDue: liability.kind === 'one-time' ? liability.dueDate : schedule.summary.nextDue?.dueDate,
      rate: liability.ratePct,
      progress: summary.principalPaidPct,
      status: summary.cleared ? 'cleared' : schedule.summary.overdue > 0 ? 'overdue' : 'active',
      sortCreatedIndex: liabilityCreationOrder.get(liability.id) ?? 0,
    };
  }));

  return (
    <>
      <Screen bottomPadding={120}>
        <AppHeader
          title="Liabilities"
          showBack
          fallbackHref="/(tabs)"
          rightActions={[{ icon: 'plus', label: 'Add a liability', onPress: () => router.push('/liability-form') }]}
        />
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Total outstanding</AppText>
          <AmountText value={overview.totalOutstanding} tier="hero" weight="bold" style={[typography.big, styles.total]} />
          <AppText style={[typography.meta, { color: colors.err }]}>
            {overview.debtFreeBy === null
              ? 'No active recurring liabilities'
              : overview.debtFreeBy === 'never'
                ? 'At least one liability needs a higher EMI to clear'
                : `Debt-free by ${formatMonth(overview.debtFreeBy.slice(0, 7))}`}
          </AppText>
          <StatPillRow>
            <StatPill
              label="Monthly EMI"
              value={<AmountText value={overview.monthlyEmi} tier="tile" />}
              accessibilityLabel={`Monthly EMI, ${formatAmount(overview.monthlyEmi, 'exact', 1)}`}
              tone="err"
            />
            <StatPill label="Of income" value={overview.emiPctOfIncome === null ? '—' : `${overview.emiPctOfIncome.toFixed(1)}%`} />
          </StatPillRow>
          {overview.incomeSource === 'salary' ? (
            <AppText style={[typography.meta, { color: colors.text3 }]}>based on your stated monthly income</AppText>
          ) : null}
          {hasRecurring ? (
            <>
              <AppText weight="semibold" style={[typography.meta, styles.whatIfLabel, { color: colors.text2 }]}>
                What if I pay extra each month?
              </AppText>
              <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Extra monthly payment</AppText>
                <View style={styles.inputAmount}>
                  <AppText weight="semibold" style={[styles.rupee, { color: colors.text2 }]}>₹</AppText>
                  <TextInput
                    accessibilityLabel="Extra monthly payment"
                    keyboardType="number-pad"
                    value={extraText}
                    onChangeText={setExtraText}
                    style={[styles.extraInput, { color: colors.text1 }]}
                  />
                </View>
              </View>
              {!isValidExtra ? (
                <AppText accessibilityRole="alert" style={[typography.meta, styles.inputError, { color: colors.err }]}>
                  {EXTRA_ERROR}
                </AppText>
              ) : null}
            </>
          ) : null}
        </Card>

        <SectionHeaderRow
          title="Liabilities"
          right={<SortChip options={SORT_OPTIONS.liabilities} spec={sorting.spec} onChange={sorting.setSpec} />}
        />

        {sortedLiabilities.map((liability) => liability.kind === 'recurring'
          ? <RecurringCard key={liability.id} liability={liability} asOf={asOf} extra={extra} />
          : <OneTimeCard key={liability.id} liability={liability} asOf={asOf} />)}
        {data.liabilities.length === 0 ? (
          <>
            <EmptyState title="No liabilities yet" subtitle="Add a liability to track its outstanding balance." />
            <View style={styles.emptyAction}>
              <Button label="Add a liability" icon="plus" variant="primary" onPress={() => router.push('/liability-form')} />
            </View>
          </>
        ) : null}
      </Screen>
      <DetailTabBar active="Home" />
    </>
  );
}

function RecurringCard({ liability, asOf, extra }: { liability: RecurringLiability; asOf: string; extra: number }) {
  const { colors } = useTheme();
  const summary = liabilitySummary(liability, asOf, extra);
  const schedule = liabilitySchedule(liability, asOf);
  const scenarioDate = summary.monthsLeftWithExtra === null
    ? null
    : payoffDate(summary.monthsLeftWithExtra, asOf);
  return (
    <View style={[styles.liabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <CardHeaderRow
        title={<AppText weight="semibold" style={typography.name}>{liability.name}</AppText>}
        subtitle={<AppText style={[typography.meta, { color: colors.text3 }]}>
            {liability.ratePct}% p.a. · {liability.tenureMonths} months · Since {formatDate(liability.startDate)}
        </AppText>}
        value={<AmountText value={summary.balance} tier="tile" weight="bold" style={typography.amount} />}
        valueCaption={(
          <AppText
            accessibilityLabel={`${formatAmount(liability.emi, 'exact', 1)} per month`}
            style={[typography.meta, { color: colors.err }]}>
            <AmountText value={liability.emi} tier="row" />/mo
          </AppText>
        )}
        editLabel={`Edit ${liability.name}`}
        onEdit={() => router.push({ pathname: '/liability-form', params: { id: liability.id } })}
      />
      <ProgressBar percent={summary.principalPaidPct} tone="ok" />
      {!summary.cleared && schedule.summary.nextDue ? (
        <AppText
          accessibilityLabel={`Next: ${formatDate(schedule.summary.nextDue.dueDate)}, ${formatAmount(schedule.summary.nextDue.amount, 'exact', 1)}`}
          style={[typography.meta, { color: colors.text2, marginTop: 7 }]}>
          Next: {formatDate(schedule.summary.nextDue.dueDate)}, <AmountText value={schedule.summary.nextDue.amount} tier="row" />
        </AppText>
      ) : null}
      <AppText
        accessibilityLabel={`Paid ${formatAmount(summary.paidTotal, 'exact', 1)}. Interest accrued ${formatAmount(summary.interestAccrued, 'exact', 1)}.${
          summary.cleared
            ? ' Cleared'
            : summary.monthsLeft === null
              ? ' EMI is too low to clear this liability'
              : ` ${summary.monthsLeft} months left · Payoff ${formatMonth(payoffDate(summary.monthsLeft, asOf).slice(0, 7))}.`
        }`}
        style={[typography.meta, styles.liabilityStatus, { color: colors.text2 }]}>
        Paid <AmountText value={summary.paidTotal} tier="row" />. Interest accrued <AmountText value={summary.interestAccrued} tier="row" />.
        {'\n'}{summary.cleared
          ? 'Cleared'
          : summary.monthsLeft === null
            ? 'EMI is too low to clear this liability'
            : `${summary.monthsLeft} months left · Payoff ${formatMonth(payoffDate(summary.monthsLeft, asOf).slice(0, 7))}.`}
      </AppText>
      {!summary.cleared && schedule.summary.overdue > 0
        ? <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        : null}
      {schedule.summary.overdue + schedule.summary.ongoing > 0 ? (
        <DueActions
          target={{ kind: 'liability', id: liability.id }}
          pendingCount={schedule.summary.overdue + schedule.summary.ongoing}
          nextAmount={schedule.rows.find((row) => row.status === 'overdue' || row.status === 'ongoing')?.amount ?? 0}
        />
      ) : null}
      {!summary.cleared && extra > 0 ? (
        <AppText style={[typography.meta, styles.scenario, { color: colors.primary }]}>
          {scenarioDate === null
            ? 'Even this extra payment will not clear the liability'
            : summary.monthsSaved === null
              ? `With extra: ${summary.monthsLeftWithExtra} months · ${formatMonth(scenarioDate.slice(0, 7))}`
              : `With extra: ${summary.monthsLeftWithExtra} months · ${formatMonth(scenarioDate.slice(0, 7))} · saves ${summary.monthsSaved} months`}
        </AppText>
      ) : null}
      <ActionRow actions={[
        ...(!summary.cleared ? [{
          label: 'Pay EMI',
          variant: 'primary' as const,
          icon: 'credit-card' as const,
          onPress: () => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, mode: 'emi' } }),
        }] : []),
        { label: `Payments (${liability.payments.length})`, icon: 'list' as const, onPress: () => router.push({ pathname: '/liability-payments', params: { id: liability.id } }) },
      ]} />
    </View>
  );
}

function OneTimeCard({ liability, asOf }: { liability: OneTimeLiability; asOf: string }) {
  const { colors } = useTheme();
  const summary = liabilitySummary(liability, asOf);
  const schedule = liabilitySchedule(liability, asOf);
  const overdue = summary.overdueDays !== undefined && !summary.cleared;
  return (
    <View style={[styles.liabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <CardHeaderRow
        title={<AppText weight="semibold" style={typography.name}>{liability.name}</AppText>}
        subtitle={<AppText style={[typography.meta, { color: colors.text3 }]}>
            {liability.type} · {liability.ratePct}% p.a. · Since {formatDate(liability.startDate)}
        </AppText>}
        value={<AmountText value={summary.balance} tier="tile" weight="bold" style={typography.amount} />}
        editLabel={`Edit ${liability.name}`}
        onEdit={() => router.push({ pathname: '/liability-form', params: { id: liability.id } })}
      />
      <ProgressBar percent={summary.principalPaidPct} tone="ok" />
      {!summary.cleared && schedule.summary.nextDue ? (
        <AppText
          accessibilityLabel={`Next: ${liability.dueDate ? formatDate(schedule.summary.nextDue.dueDate) : 'No due date'}, ${formatAmount(schedule.summary.nextDue.amount, 'exact', 1)}`}
          style={[typography.meta, { color: colors.text2, marginTop: 7 }]}>
          Next: {liability.dueDate ? formatDate(schedule.summary.nextDue.dueDate) : 'No due date'}, <AmountText value={schedule.summary.nextDue.amount} tier="row" />
        </AppText>
      ) : null}
      <AppText
        accessibilityLabel={`Due ${liability.dueDate ? formatDate(liability.dueDate) : 'No due date'} · Paid ${formatAmount(summary.paidTotal, 'exact', 1)}${overdue ? ` Overdue by ${summary.overdueDays} days` : ''}`}
        style={[typography.meta, styles.liabilityStatus, { color: colors.text2 }]}>
        Due {liability.dueDate ? formatDate(liability.dueDate) : 'No due date'} · Paid <AmountText value={summary.paidTotal} tier="row" />
        {overdue ? `\nOverdue by ${summary.overdueDays} days` : ''}
      </AppText>
      {!summary.cleared && schedule.summary.overdue > 0
        ? <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        : null}
      <ActionRow actions={[
        ...(!summary.cleared ? [{
          label: 'Pay',
          variant: 'primary' as const,
          icon: 'credit-card' as const,
          onPress: () => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } }),
        }] : []),
        { label: `Payments (${liability.payments.length})`, icon: 'list' as const, onPress: () => router.push({ pathname: '/liability-payments', params: { id: liability.id } }) },
      ]} />
      {overdue ? <AppText style={[typography.meta, { color: colors.err }]}>This liability is overdue.</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  total: { marginTop: 5 },
  whatIfLabel: { marginTop: 16 },
  inputWrap: { minHeight: 48, marginTop: 7, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inputAmount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontSize: 13 },
  extraInput: { minWidth: 82, paddingVertical: 6, fontSize: 13, textAlign: 'right', fontFamily: 'Montserrat_600SemiBold' },
  inputError: { marginTop: 5 },
  liabilityCard: { marginHorizontal: 20, marginTop: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  liabilityStatus: { marginTop: 8, lineHeight: 18 },
  scenario: { marginTop: 7 },
  emptyAction: { marginHorizontal: 20, marginTop: 10 },
  sortRow: { marginHorizontal: 20, marginTop: 8 },
});
