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
} from '../src/components/ui';
import { loansOverview } from '../src/domain/summary';
import { payoffDate } from '../src/domain/loan';
import { useAppData } from '../src/data/useAppData';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR, formatMonth } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const EXTRA_ERROR = 'Enter a whole number between 0 and 10,00,000';

export default function LoansScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const [extraText, setExtraText] = useState('0');
  const isValidExtra = /^\d+$/.test(extraText) && Number.isSafeInteger(Number(extraText))
    && Number(extraText) >= 0 && Number(extraText) <= 1_000_000;
  const extra = isValidExtra ? Number(extraText) : 0;
  const overview = loansOverview(data, asOf, extra);

  return (
    <>
      <Screen bottomPadding={120}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="arrow-left" size={18} color={colors.text1} />
            </Pressable>
            <AppText weight="bold" style={[typography.h1, styles.title]}>Loans</AppText>
          </View>
          <View style={styles.headerActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New loan"
              onPress={() => router.push('/loan-form')}
              style={[styles.headerAction, { backgroundColor: colors.primaryDim }]}>
              <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>New loan</AppText>
            </Pressable>
          </View>
        </View>
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Total outstanding</AppText>
          <AppText weight="bold" style={[typography.big, styles.total]}>{formatINR(overview.totalOutstanding)}</AppText>
          <AppText style={[typography.meta, { color: colors.err }]}>
            {overview.loanFreeBy === null
              ? 'No active loans'
              : overview.loanFreeBy === 'never'
                ? 'At least one loan needs a higher EMI to clear'
                : `Loan-free by ${formatMonth(overview.loanFreeBy.slice(0, 7))}`}
          </AppText>
          <StatPillRow>
            <StatPill label="Monthly EMI" value={formatINR(overview.monthlyEmi)} tone="err" />
            <StatPill label="Of income" value={overview.emiPctOfIncome === null ? '—' : `${overview.emiPctOfIncome.toFixed(1)}%`} />
          </StatPillRow>
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
        </Card>

        {data.loans.map((loan, index) => {
          const summary = overview.items[index];
          if (!summary) return null;
          const scenarioDate = summary.monthsLeftWithExtra === null
            ? null
            : payoffDate(summary.monthsLeftWithExtra, asOf);
          return (
            <View key={loan.id} style={[styles.loanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.loanHeader}>
                <View style={styles.loanTitle}>
                  <AppText weight="semibold" style={typography.name}>{loan.name}</AppText>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    {loan.ratePct}% p.a. · {loan.tenureMonths} months · Since {formatDate(loan.startDate)}
                  </AppText>
                </View>
                <View style={styles.amountBlock}>
                  <AppText weight="bold" style={typography.amount}>{formatINR(summary.balance)}</AppText>
                  <AppText style={[typography.meta, { color: colors.err }]}>{formatINR(loan.emi)}/mo</AppText>
                </View>
              </View>
              <ProgressBar percent={summary.principalPaidPct} tone="ok" />
              <AppText style={[typography.meta, styles.loanStatus, { color: colors.text2 }]}>
                Paid {formatINR(summary.paidTotal)}. Interest accrued {formatINR(summary.interestAccrued)}.
                {'\n'}{summary.cleared
                  ? 'Cleared'
                  : summary.monthsLeft === null
                    ? 'EMI is too low to clear this loan'
                    : `${summary.monthsLeft} months left · Payoff ${formatMonth(payoffDate(summary.monthsLeft, asOf).slice(0, 7))}.`}
              </AppText>
              {!summary.cleared && extra > 0 ? (
                <AppText style={[typography.meta, styles.scenario, { color: colors.primary }]}>
                  {scenarioDate === null
                    ? 'Even this extra payment will not clear the loan'
                    : summary.monthsSaved === null
                      ? `With extra: ${summary.monthsLeftWithExtra} months · ${formatMonth(scenarioDate.slice(0, 7))}`
                      : `With extra: ${summary.monthsLeftWithExtra} months · ${formatMonth(scenarioDate.slice(0, 7))} · saves ${summary.monthsSaved} months`}
                </AppText>
              ) : null}
              <ActionRow
                actions={[
                  ...(!summary.cleared ? [{ label: 'Pay EMI', variant: 'primary' as const, onPress: () => router.push({ pathname: '/loan-payment-form', params: { loanId: loan.id, mode: 'emi' } }) }] : []),
                  { label: `Payments (${loan.payments.length})`, onPress: () => router.push({ pathname: '/loan-payments', params: { id: loan.id } }) },
                  { label: 'Edit', onPress: () => router.push({ pathname: '/loan-form', params: { id: loan.id } }) },
                ]}
              />
            </View>
          );
        })}
        {data.loans.length === 0 ? (
          <>
            <EmptyState title="No loans yet" subtitle="Add a loan to track your outstanding balance." />
            <View style={styles.emptyAction}><Button label="Add a loan" variant="primary" onPress={() => router.push('/loan-form')} /></View>
          </>
        ) : null}
      </Screen>
      <DetailTabBar />
    </>
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
  whatIfLabel: { marginTop: 14, marginBottom: 7 },
  inputWrap: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 7, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', gap: 4 },
  inputAmount: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-end' },
  rupee: { fontSize: 13 },
  extraInput: { width: 56, flexGrow: 0, flexShrink: 0, padding: 0, fontSize: 13, fontFamily: 'Montserrat_600SemiBold', textAlign: 'right' },
  inputError: { marginTop: 5 },
  loanCard: { marginHorizontal: 20, marginTop: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  loanHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  loanTitle: { flex: 1, minWidth: 0, gap: 3 },
  amountBlock: { alignItems: 'flex-end', gap: 3 },
  loanStatus: { marginTop: 8, lineHeight: 18 },
  scenario: { marginTop: 5 },
  emptyAction: { marginHorizontal: 20, marginTop: 10 },
});
