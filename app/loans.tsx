import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ActionRow,
  AppText,
  Card,
  DetailTabBar,
  ProgressBar,
  Screen,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { displaySummary, loans } from '../src/mock/data';
import { formatDate, formatINR } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export default function LoansScreen() {
  const { colors } = useTheme();
  const loan = loans[0];
  if (!loan) return null;
  const paid = loan.payments.reduce((total, payment) => total + payment.amount, 0);
  const progress = (paid / loan.principal) * 100;

  return (
    <>
      <Screen bottomPadding={120}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={18} color={colors.text1} />
          </Pressable>
          <AppText weight="bold" style={[typography.h1, styles.title]}>Loans</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New loan"
            onPress={() => {
              // TODO(phase5)
            }}
            style={[styles.headerAction, { backgroundColor: colors.primaryDim }]}>
            <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>New loan</AppText>
          </Pressable>
        </View>
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Total outstanding</AppText>
          <AppText weight="bold" style={[typography.big, styles.total]}>{formatINR(302_000)}</AppText>
          <AppText style={[typography.meta, { color: colors.err }]}>Loan-free in about {displaySummary.loanMonthsLeft} months</AppText>
          <StatPillRow>
            <StatPill label="Monthly EMI" value={formatINR(loan.emi)} tone="err" />
            <StatPill label="Of income" value="11.4%" />
          </StatPillRow>
          <AppText weight="semibold" style={[typography.meta, styles.whatIfLabel, { color: colors.text2 }]}>
            What if I pay extra each month?
          </AppText>
          <View style={[styles.readOnlyInput, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <AppText style={[typography.meta, { color: colors.text3 }]}>Extra monthly payment</AppText>
            <AppText weight="semibold" style={[styles.extraAmount, { color: colors.text2 }]}>₹0</AppText>
          </View>
          <AppText style={[typography.meta, styles.displayOnly, { color: colors.text3 }]}>What-if calculator coming soon</AppText>
        </Card>

        <View style={[styles.loanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.loanHeader}>
            <View style={styles.loanTitle}>
              <AppText weight="semibold" style={typography.name}>{loan.name}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>
                {loan.ratePct}% p.a. · {loan.tenureMonths} months · Since {formatDate(loan.startDate)}
              </AppText>
            </View>
            <View style={styles.amountBlock}>
              <AppText weight="bold" style={typography.amount}>{formatINR(302_000)}</AppText>
              <AppText style={[typography.meta, { color: colors.err }]}>{formatINR(loan.emi)}/mo</AppText>
            </View>
          </View>
          <ProgressBar percent={progress} tone="ok" />
          <AppText style={[typography.meta, styles.loanStatus, { color: colors.text2 }]}>
            Paid {formatINR(paid)}. Interest accrued {formatINR(10_278)}.
            {'\n'}{displaySummary.loanMonthsLeft} months left · Estimated payoff: April 2032.
          </AppText>
          <ActionRow
            actions={[
              { label: 'Pay EMI', variant: 'primary', onPress: () => {
                // TODO(phase5)
              } },
              { label: `Payments (${loan.payments.length})`, onPress: () => {
                // TODO(phase5)
              } },
              { label: 'Edit', onPress: () => {
                // TODO(phase5)
              } },
            ]}
          />
        </View>
      </Screen>
      <DetailTabBar />
    </>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 56, paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1 },
  headerAction: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  total: { marginTop: 5 },
  whatIfLabel: { marginTop: 14, marginBottom: 7 },
  readOnlyInput: { minHeight: 48, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  extraAmount: { fontSize: 13 },
  displayOnly: { marginTop: 5 },
  loanCard: { marginHorizontal: 20, marginTop: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  loanHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  loanTitle: { flex: 1, minWidth: 0, gap: 3 },
  amountBlock: { alignItems: 'flex-end', gap: 3 },
  loanStatus: { marginTop: 8, lineHeight: 18 },
});
