import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  DetailTabBar,
  Screen,
  SectionTitle,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { efBalance, efPassbook, milestones, monthlyBaseline, monthsCovered } from '../src/domain/ef';
import { useAppData } from '../src/data/useAppData';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

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
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="arrow-left" size={18} color={colors.text1} />
            </Pressable>
            <AppText weight="bold" style={[typography.h1, styles.title]}>Emergency fund</AppText>
          </View>
          <View style={styles.headerActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log emergency fund entry"
              onPress={() => {
                // TODO(phase4)
              }}
              style={[styles.headerAction, { backgroundColor: colors.primaryDim }]}>
              <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>Log entry</AppText>
            </Pressable>
          </View>
        </View>
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Current balance</AppText>
          <AppText weight="bold" style={[typography.big, styles.balance]}>{formatINR(balance)}</AppText>
          {baseline > 0 ? (
            <AppText style={[typography.meta, { color: colors.primary }]}>
              {covered!.toFixed(1)} months of expenses covered
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
            <View key={entry.id} style={[styles.passbookRow, { borderBottomColor: colors.border }]}>
              <View style={styles.entryDetails}>
                <AppText weight="bold" style={[typography.amount, { color: entry.amount < 0 ? colors.err : colors.ok }]}>
                  {entry.amount < 0 ? '-' : '+'}{formatINR(Math.abs(entry.amount))}
                </AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>{formatDate(entry.date)} · {entry.note}</AppText>
              </View>
              <AppText weight="bold" style={typography.amount}>{formatINR(entry.balance)}</AppText>
            </View>
          ))}
        </View>
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
  balance: { marginTop: 5 },
  basedOn: { marginTop: 8 },
  passbook: { marginHorizontal: 20 },
  passbookRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  entryDetails: { flex: 1, minWidth: 0, gap: 3 },
});
