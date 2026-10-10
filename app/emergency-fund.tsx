import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import {
  AppText,
  Card,
  DetailTabBar,
  Screen,
  SectionTitle,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { efBalance, efPassbook, milestones, monthlyBaseline, monthsCovered } from '../src/domain/ef';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function EmergencyFundScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const asOf = todayISO();
  const balance = efBalance(data.efEntries);
  const baseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const covered = monthsCovered(balance, baseline);
  const fundMilestones = milestones(balance, baseline);
  const entries = efPassbook(data.efEntries);

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
          <AppText weight="bold" style={[typography.big, styles.balance]}>{formatINR(balance)}</AppText>
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
            <AppText style={[typography.meta, styles.basedOn, { color: colors.text3 }]}>
              Based on an average of {formatINR(baseline)} monthly expenses.
            </AppText>
          ) : null}
        </Card>

        <SectionTitle>Passbook</SectionTitle>
        <View style={styles.passbook}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${entry.amount < 0 ? 'withdrawal' : 'deposit'} ${formatINR(Math.abs(entry.amount))} from ${formatDate(entry.date)}`}
              onPress={() => router.push({ pathname: '/ef-entry-form', params: { id: entry.id } })}
              style={[styles.passbookRow, { borderBottomColor: colors.border }]}>
              <View style={styles.entryDetails}>
                <AppText weight="bold" style={[typography.amount, { color: entry.amount < 0 ? colors.err : colors.ok }]}>
                  {entry.amount < 0 ? '-' : '+'}{formatINR(Math.abs(entry.amount))}
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>{formatDate(entry.date)} · {entry.note}</AppText>
              </View>
              <AppText weight="bold" style={typography.amount}>{formatINR(entry.balance)}</AppText>
            </Pressable>
          ))}
        </View>
      </Screen>
      <DetailTabBar active="Home" />
    </>
  );
}

const styles = StyleSheet.create({
  balance: { marginTop: 5 },
  basedOn: { marginTop: 8 },
  passbook: { marginHorizontal: 20 },
  passbookRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  entryDetails: { flex: 1, minWidth: 0, gap: 3 },
});
