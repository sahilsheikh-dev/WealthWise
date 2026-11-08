import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  ActionRow,
  AppText,
  Card,
  DetailTabBar,
  EmptyState,
  Button,
  ProgressBar,
  Screen,
  StatPill,
  StatPillRow,
  StatusBadge,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { liabilitySummary, payoffDate } from '../src/domain/liability';
import { liabilitiesOverview } from '../src/domain/summary';
import { liabilitySchedule } from '../src/domain/schedule';
import type { OneTimeLiability, RecurringLiability } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR, formatMonth } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const EXTRA_ERROR = 'Enter a whole number between 0 and 10,00,000';

export default function LiabilitiesScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const [extraText, setExtraText] = useState('0');
  const hasRecurring = data.liabilities.some((liability) => liability.kind === 'recurring');
  const isValidExtra = /^\d+$/.test(extraText) && Number.isSafeInteger(Number(extraText))
    && Number(extraText) >= 0 && Number(extraText) <= 1_000_000;
  const extra = isValidExtra ? Number(extraText) : 0;
  const overview = liabilitiesOverview(data, asOf, extra);

  return (
    <>
      <Screen bottomPadding={120}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
              style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="arrow-left" size={18} color={colors.text1} />
            </Pressable>
            <AppText weight="bold" style={[typography.h1, styles.title]}>Liabilities</AppText>
          </View>
          <View style={styles.headerActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a liability"
              onPress={() => router.push('/liability-form')}
              style={[styles.headerAction, { backgroundColor: colors.primaryDim }]}>
              <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>Add liability</AppText>
            </Pressable>
          </View>
        </View>
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Total outstanding</AppText>
          <AppText weight="bold" style={[typography.big, styles.total]}>{formatINR(overview.totalOutstanding)}</AppText>
          <AppText style={[typography.meta, { color: colors.err }]}>
            {overview.debtFreeBy === null
              ? 'No active recurring liabilities'
              : overview.debtFreeBy === 'never'
                ? 'At least one liability needs a higher EMI to clear'
                : `Debt-free by ${formatMonth(overview.debtFreeBy.slice(0, 7))}`}
          </AppText>
          <StatPillRow>
            <StatPill label="Monthly EMI" value={formatINR(overview.monthlyEmi)} tone="err" />
            <StatPill label="Of income" value={overview.emiPctOfIncome === null ? '—' : `${overview.emiPctOfIncome.toFixed(1)}%`} />
          </StatPillRow>
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

        {data.liabilities.map((liability) => liability.kind === 'recurring'
          ? <RecurringCard key={liability.id} liability={liability} asOf={asOf} extra={extra} />
          : <OneTimeCard key={liability.id} liability={liability} asOf={asOf} />)}
        {data.liabilities.length === 0 ? (
          <>
            <EmptyState title="No liabilities yet" subtitle="Add a liability to track its outstanding balance." />
            <View style={styles.emptyAction}>
              <Button label="Add a liability" variant="primary" onPress={() => router.push('/liability-form')} />
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
      <View style={styles.liabilityHeader}>
        <View style={styles.liabilityTitle}>
          <AppText weight="semibold" style={typography.name}>{liability.name}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            {liability.ratePct}% p.a. · {liability.tenureMonths} months · Since {formatDate(liability.startDate)}
          </AppText>
        </View>
        <View style={styles.amountBlock}>
          <AppText weight="bold" style={typography.amount}>{formatINR(summary.balance)}</AppText>
          <AppText style={[typography.meta, { color: colors.err }]}>{formatINR(liability.emi)}/mo</AppText>
        </View>
      </View>
      <ProgressBar percent={summary.principalPaidPct} tone="ok" />
      {!summary.cleared && schedule.summary.nextDue ? (
        <AppText style={[typography.meta, { color: colors.text2, marginTop: 7 }]}>
          Next: {formatDate(schedule.summary.nextDue.dueDate)}, {formatINR(schedule.summary.nextDue.amount)}
        </AppText>
      ) : null}
      <AppText style={[typography.meta, styles.liabilityStatus, { color: colors.text2 }]}>
        Paid {formatINR(summary.paidTotal)}. Interest accrued {formatINR(summary.interestAccrued)}.
        {'\n'}{summary.cleared
          ? 'Cleared'
          : summary.monthsLeft === null
            ? 'EMI is too low to clear this liability'
            : `${summary.monthsLeft} months left · Payoff ${formatMonth(payoffDate(summary.monthsLeft, asOf).slice(0, 7))}.`}
      </AppText>
      {!summary.cleared && schedule.summary.overdue > 0
        ? <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        : null}
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
          onPress: () => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, mode: 'emi' } }),
        }] : []),
        { label: `Payments (${liability.payments.length})`, onPress: () => router.push({ pathname: '/liability-payments', params: { id: liability.id } }) },
        { label: 'Edit', onPress: () => router.push({ pathname: '/liability-form', params: { id: liability.id } }) },
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
      <View style={styles.liabilityHeader}>
        <View style={styles.liabilityTitle}>
          <AppText weight="semibold" style={typography.name}>{liability.name}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            {liability.type} · {liability.ratePct}% p.a. · Since {formatDate(liability.startDate)}
          </AppText>
        </View>
        <View style={styles.amountBlock}>
          <AppText weight="bold" style={typography.amount}>{formatINR(summary.balance)}</AppText>
        </View>
      </View>
      <ProgressBar percent={summary.principalPaidPct} tone="ok" />
      {!summary.cleared && schedule.summary.nextDue ? (
        <AppText style={[typography.meta, { color: colors.text2, marginTop: 7 }]}>
          Next: {liability.dueDate ? formatDate(schedule.summary.nextDue.dueDate) : 'No due date'}, {formatINR(schedule.summary.nextDue.amount)}
        </AppText>
      ) : null}
      <AppText style={[typography.meta, styles.liabilityStatus, { color: colors.text2 }]}>
        Due {liability.dueDate ? formatDate(liability.dueDate) : 'No due date'} · Paid {formatINR(summary.paidTotal)}
        {overdue ? `\nOverdue by ${summary.overdueDays} days` : ''}
      </AppText>
      {!summary.cleared && schedule.summary.overdue > 0
        ? <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        : null}
      <ActionRow actions={[
        ...(!summary.cleared ? [{
          label: 'Pay',
          variant: 'primary' as const,
          onPress: () => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } }),
        }] : []),
        { label: `Payments (${liability.payments.length})`, onPress: () => router.push({ pathname: '/liability-payments', params: { id: liability.id } }) },
        { label: 'Edit', onPress: () => router.push({ pathname: '/liability-form', params: { id: liability.id } }) },
      ]} />
      {overdue ? <AppText style={[typography.meta, { color: colors.err }]}>This liability is overdue.</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  headerTop: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActionRow: { alignItems: 'flex-end' },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, minWidth: 0 },
  headerAction: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  total: { marginTop: 5 },
  whatIfLabel: { marginTop: 16 },
  inputWrap: { minHeight: 48, marginTop: 7, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inputAmount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontSize: 13 },
  extraInput: { minWidth: 82, paddingVertical: 6, fontSize: 13, textAlign: 'right', fontFamily: 'Montserrat_600SemiBold' },
  inputError: { marginTop: 5 },
  liabilityCard: { marginHorizontal: 20, marginTop: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  liabilityHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  liabilityTitle: { flex: 1, minWidth: 0, gap: 3 },
  amountBlock: { alignItems: 'flex-end', gap: 3 },
  liabilityStatus: { marginTop: 8, lineHeight: 18 },
  scenario: { marginTop: 7 },
  emptyAction: { marginHorizontal: 20, marginTop: 10 },
});
