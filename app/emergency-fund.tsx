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
import { emergencyFundEntries, displaySummary } from '../src/mock/data';
import { formatDate, formatINR } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export default function EmergencyFundScreen() {
  const { colors } = useTheme();
  const milestones = [3, 6, 12];
  const entries = [...emergencyFundEntries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry, index, all) => ({
      ...entry,
      balance: all.slice(0, index + 1).reduce((total, item) => total + item.amount, 0),
    }))
    .reverse();

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
          <AppText weight="bold" style={[typography.h1, styles.title]}>Emergency fund</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log emergency fund entry"
            onPress={() => {
              // TODO(phase5)
            }}
            style={[styles.headerAction, { backgroundColor: colors.primaryDim }]}>
            <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>Log entry</AppText>
          </Pressable>
        </View>
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Current balance</AppText>
          <AppText weight="bold" style={[typography.big, styles.balance]}>{formatINR(155_000)}</AppText>
          <AppText style={[typography.meta, { color: colors.primary }]}>
            {displaySummary.emergencyMonthsCovered} months of expenses covered
          </AppText>
          <StatPillRow>
            {milestones.map((month) => {
              const progress = (155_000 / (displaySummary.monthlyExpenses * month)) * 100;
              const complete = progress >= 100;
              return (
                <StatPill
                  key={month}
                  label={`${month} months`}
                  value={complete ? 'Done' : `${Math.round(progress)}%`}
                  tone={complete ? 'ok' : 'primary'}
                />
              );
            })}
          </StatPillRow>
          <AppText style={[typography.meta, styles.basedOn, { color: colors.text3 }]}>
            Based on {formatINR(displaySummary.monthlyExpenses)} expenses in your latest month.
          </AppText>
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
  header: { minHeight: 56, paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1 },
  headerAction: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  balance: { marginTop: 5 },
  basedOn: { marginTop: 8 },
  passbook: { marginHorizontal: 20 },
  passbookRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  entryDetails: { flex: 1, minWidth: 0, gap: 3 },
});
