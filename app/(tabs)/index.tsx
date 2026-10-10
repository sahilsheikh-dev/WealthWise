import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';

import {
  AppText,
  Card,
  ProgressBar,
  Screen,
  SectionTitle,
  StatPill,
  StatPillRow,
} from '../../src/components/ui';
import { homeSummary } from '../../src/domain/summary';
import { formatINR, formatINRShort } from '../../src/lib/format';
import { useAppData } from '../../src/data/useAppData';
import { currentHour, todayISO } from '../../src/lib/clock';
import { greetingFor } from '../../src/lib/greeting';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const actions = [
  { label: 'Add txn', icon: 'plus-circle' as const },
  { label: 'New SIP', icon: 'repeat' as const },
  { label: 'New loan', icon: 'credit-card' as const },
  { label: 'Log EF', icon: 'shield' as const },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const summary = homeSummary(data, todayISO());
  return (
    <Screen>
      <View style={styles.homeHeader}>
        <AppText style={[typography.meta, { color: colors.text3 }]}>{greetingFor(currentHour())},</AppText>
        <AppText weight="bold" style={typography.h1}>{data.settings.name || 'Welcome'}</AppText>
      </View>
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Net worth</AppText>
        <AppText weight="bold" style={[typography.big, styles.netWorth]}>{formatINR(summary.netWorth)}</AppText>
        <StatPillRow>
          <StatPill label="Assets" value={formatINRShort(summary.assets)} tone="ok" />
          <StatPill label="Liabilities" value={formatINRShort(summary.liabilities)} tone="err" />
          <StatPill
            label="Emergency fund"
            value={summary.emergencyMonths === null ? '—' : `${summary.emergencyMonths.toFixed(1)} mo`}
            tone="primary"
          />
        </StatPillRow>
      </Card>

      <View style={styles.quickActions}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              if (action.label === 'Add txn') {
                router.push('/transaction-form');
                return;
              }
              if (action.label === 'New SIP') {
                router.push('/plan-form');
                return;
              }
              if (action.label === 'New loan') {
                router.push('/loan-form');
                return;
              }
              // TODO(phase5)
            }}
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name={action.icon} size={17} color={colors.primary} />
            <AppText weight="semibold" style={[styles.actionLabel, { color: colors.text2 }]}>{action.label}</AppText>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Goal progress</SectionTitle>
      {summary.goals.slice(0, 3).map(({ goal, saved, pct }) => (
        <View key={goal.id} style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.goalTop}>
            <View style={styles.goalNameBlock}>
              <AppText weight="semibold" style={typography.name}>{goal.name}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>Target {goal.year}</AppText>
            </View>
            <AppText weight="bold" style={[styles.goalPercent, { color: colors.primary }]}>{pct.toFixed(1)}%</AppText>
          </View>
          <ProgressBar percent={pct} />
          <View style={styles.goalAmounts}>
            <AppText style={[typography.meta, { color: colors.ok }]}>{formatINRShort(saved)} saved</AppText>
            <AppText style={[typography.meta, { color: colors.text3 }]}>{formatINRShort(Math.max(0, goal.target - saved))} left</AppText>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeHeader: { paddingHorizontal: 20, paddingTop: 16, gap: 2 },
  netWorth: { marginTop: 5 },
  quickActions: { marginHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 8 },
  quickAction: { minHeight: 76, flex: 1, minWidth: 0, paddingHorizontal: 4, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionLabel: { fontSize: 10, textAlign: 'center' },
  goal: { marginHorizontal: 20, marginBottom: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goalNameBlock: { flex: 1, minWidth: 0, gap: 3 },
  goalPercent: { fontSize: 12 },
  goalAmounts: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
