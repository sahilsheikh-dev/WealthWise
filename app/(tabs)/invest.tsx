import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ActionRow,
  AppText,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  ListItem,
  ProgressBar,
  Screen,
  ScreenHeader,
  StatPill,
  StatPillRow,
} from '../../src/components/ui';
import { holdings } from '../../src/mock/data';
import type { Holding, HoldingType } from '../../src/domain/types';
import { formatINR, formatINRShort } from '../../src/lib/format';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const filters: ('All' | 'Recurring' | HoldingType | 'Emergency fund')[] = [
  'All',
  'Recurring',
  'Mutual fund / SIP',
  'Stocks / ETF',
  'Fixed deposit',
  'Recurring deposit',
  'EPFO / PF',
  'Savings account',
  'Cash',
  'Gold',
  'Silver',
  'Other',
  'Emergency fund',
];

export default function InvestScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<string>('All');
  const invested = 96_985 + 110_000 + 50_000 + 3 * 21_200 + 155_000;
  const portfolioValue = 135_385 + 135_456 + 98_500 + 155_000;
  const gain = portfolioValue - invested;
  const visibleHoldings = useMemo(
    () => holdings.filter((holding) => {
      if (filter === 'All') return true;
      if (filter === 'Recurring') return holding.kind === 'plan';
      return holding.type === filter;
    }),
    [filter],
  );
  const showEmergency = filter === 'All' || filter === 'Emergency fund';

  return (
    <Screen>
      <ScreenHeader title="Portfolio" right={(
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New SIP"
            onPress={() => {
              // TODO(phase5)
            }}
            style={[styles.headerButton, { backgroundColor: colors.primaryDim }]}>
            <AppText weight="semibold" style={[typography.chip, { color: colors.primary }]}>New SIP</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add holding"
            onPress={() => {
              // TODO(phase5)
            }}
            style={[styles.headerButton, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <AppText weight="semibold" style={[typography.chip, { color: colors.text2 }]}>Add</AppText>
          </Pressable>
        </View>
      )} />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Total value</AppText>
        <AppText weight="bold" style={[typography.big, styles.total]}>{formatINR(portfolioValue)}</AppText>
        <AppText style={[typography.meta, { color: gain >= 0 ? colors.ok : colors.err }]}>
          +{formatINR(gain)} ({((gain / invested) * 100).toFixed(1)}% overall)
        </AppText>
        <StatPillRow>
          <StatPill label="Invested" value={formatINRShort(invested)} />
          <StatPill label="Gain" value={formatINRShort(gain)} tone="ok" />
          <StatPill label="Monthly SIP/RD" value={formatINRShort(23_200)} tone="primary" />
        </StatPillRow>
      </Card>

      <ChipRow>
        {filters.map((item) => (
          <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </ChipRow>

      <View style={styles.holdingList}>
        {visibleHoldings.map((holding) =>
          holding.kind === 'plan' ? (
            <PlanCard key={holding.id} holding={holding} />
          ) : (
            <HoldingItem key={holding.id} holding={holding} />
          ),
        )}
        {showEmergency ? (
          <ListItem
            title="Emergency fund"
              subtitle={`Savings account · ${formatINR(155_000)} · Auto-synced`}
            amount={formatINR(155_000)}
            amountSub="Emergency fund"
            tone="primary"
            icon="shield"
          />
        ) : null}
        {visibleHoldings.length === 0 && !showEmergency ? (
          <EmptyState title="Nothing in this category yet" subtitle="Your holdings will appear here." />
        ) : null}
      </View>
      <AppText style={[typography.meta, styles.note, { color: colors.text3 }]}>
        Plan values are an estimate unless an actual value is supplied.
      </AppText>
    </Screen>
  );
}

function HoldingItem({ holding }: { holding: Extract<Holding, { kind: 'manual' }> }) {
  const gainPercent = ((holding.value - holding.invested) / holding.invested) * 100;
  return (
    <ListItem
      title={holding.name}
      subtitle={`${holding.type}, invested ${formatINR(holding.invested)}`}
      amount={formatINR(holding.value)}
      amountSub={`${gainPercent > 0 ? '+' : ''}${gainPercent.toFixed(1)}%`}
      tone={gainPercent >= 0 ? 'ok' : 'err'}
      icon="briefcase"
    />
  );
}

function PlanCard({ holding }: { holding: Extract<Holding, { kind: 'plan' }> }) {
  const { colors } = useTheme();
  const totalLogged = holding.logs.reduce((total, log) => total + log.amount, 0);
  const totalInvested = holding.opening + totalLogged;
  const contributionPlan = holding.amount * 12 * holding.tenureYears;
  const progress = Math.min(100, (totalInvested / contributionPlan) * 100);
  const actualValue = holding.actualValue ?? totalInvested;
  const progressLabel = `${holding.type}, Monthly ${formatINR(holding.amount)}, ${holding.stepUpPct}% step-up, ${holding.tenureYears} yrs, ${holding.ratePct}% p.a.`;

  return (
    <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.planHeading}>
        <View style={styles.planTitle}>
          <AppText weight="semibold" style={typography.name}>{holding.name}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>{progressLabel}</AppText>
        </View>
        <View style={styles.planValue}>
          <AppText weight="bold" style={typography.amount}>{formatINR(actualValue)}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>Actual value</AppText>
        </View>
      </View>
      <ProgressBar percent={progress} />
      <AppText style={[typography.meta, styles.planDescription, { color: colors.text2 }]}>
        Invested {formatINR(totalInvested)}. Plan: {formatINRShort(contributionPlan)} in contributions.
        {' '}{holding.logs.length} of {holding.tenureYears * 12} installments logged.
      </AppText>
      <ActionRow
        actions={[
          { label: 'Log installment', variant: 'primary', onPress: () => {
            // TODO(phase5)
          } },
          { label: `Logs (${holding.logs.length})`, onPress: () => {
            // TODO(phase5)
          } },
          { label: 'Edit', onPress: () => {
            // TODO(phase5)
          } },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: 6 },
  headerButton: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  total: { marginTop: 5 },
  holdingList: { marginHorizontal: 20, marginTop: 12 },
  planCard: { marginBottom: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  planHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  planTitle: { flex: 1, minWidth: 0, gap: 3 },
  planValue: { maxWidth: '38%', alignItems: 'flex-end', gap: 3 },
  planDescription: { marginTop: 8, lineHeight: 18 },
  note: { marginHorizontal: 20, marginTop: 2, marginBottom: 16 },
});
