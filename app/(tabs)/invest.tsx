import { View, Pressable, StyleSheet } from 'react-native';
import { useMemo, useState } from 'react';

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
import {
  buildPortfolioRows,
  filterRows,
  monthlyCommitment,
  portfolioTotals,
  type PortfolioRow,
} from '../../src/domain/portfolio';
import { behindBy, installmentsDue, loggedCount, planInvested, planProgressPct, planValue, projection } from '../../src/domain/sip';
import type { Holding, HoldingType } from '../../src/domain/types';
import { useAppData } from '../../src/data/useAppData';
import { todayISO } from '../../src/lib/clock';
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
  const data = useAppData();
  const asOf = todayISO();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const rows = useMemo(() => buildPortfolioRows(data, asOf), [data, asOf]);
  const totals = portfolioTotals(rows);
  const visibleRows = filterRows(rows, filter);
  const gainTone = totals.gain >= 0 ? colors.ok : colors.err;

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
        <AppText weight="bold" style={[typography.big, styles.total]}>{formatINR(totals.value)}</AppText>
        <AppText style={[typography.meta, { color: gainTone }]}>
          {totals.gain > 0 ? '+' : ''}{formatINR(totals.gain)}
          {totals.gainPct === null ? '' : ` (${totals.gainPct.toFixed(1)}% overall)`}
        </AppText>
        <StatPillRow>
          <StatPill label="Invested" value={formatINRShort(totals.invested)} />
          <StatPill label="Gain" value={formatINRShort(totals.gain)} tone={totals.gain >= 0 ? 'ok' : 'err'} />
          <StatPill label="Monthly SIP/RD" value={formatINRShort(monthlyCommitment(data.holdings))} tone="primary" />
        </StatPillRow>
      </Card>

      <ChipRow>
        {filters.map((item) => (
          <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </ChipRow>

      <View style={styles.holdingList}>
        {visibleRows.map((row) => {
          if (row.kind === 'auto-ef') {
            return (
              <ListItem
                key={row.id}
                title={row.name}
                subtitle={`Savings account · ${formatINR(row.value)} · Auto-synced`}
                amount={formatINR(row.value)}
                amountSub={row.type}
                tone="primary"
                icon="shield"
              />
            );
          }
          const holding = row.holding;
          if (!holding) return null;
          return holding.kind === 'plan'
            ? <PlanCard key={row.id} holding={holding} asOf={asOf} />
            : <HoldingItem key={row.id} row={row} holding={holding} />;
        })}
        {visibleRows.length === 0 ? (
          <EmptyState title="Nothing in this category yet" subtitle="Your holdings will appear here." />
        ) : null}
      </View>
      <AppText style={[typography.meta, styles.note, { color: colors.text3 }]}>
        Plan values are estimates unless an actual value is supplied.
      </AppText>
    </Screen>
  );
}

function HoldingItem({
  row,
  holding,
}: {
  row: PortfolioRow;
  holding: Extract<Holding, { kind: 'manual' }>;
}) {
  return (
    <ListItem
      title={holding.name}
      subtitle={`${holding.type}, invested ${formatINR(row.invested)}`}
      amount={formatINR(row.value)}
      amountSub={row.gainPct === null ? '—' : `${row.gainPct > 0 ? '+' : ''}${row.gainPct.toFixed(1)}%`}
      tone={row.gain >= 0 ? 'ok' : 'err'}
      icon="briefcase"
    />
  );
}

function PlanCard({
  holding,
  asOf,
}: {
  holding: Extract<Holding, { kind: 'plan' }>;
  asOf: ReturnType<typeof todayISO>;
}) {
  const { colors } = useTheme();
  const due = installmentsDue(holding, asOf);
  const overdue = behindBy(holding, asOf);
  const planProjection = projection(holding);
  const currentValue = planValue(holding, asOf);
  const contributionPlan = planProjection.totalContributions;
  const progress = planProgressPct(holding);
  const progressLabel = `${holding.type}, Monthly ${formatINR(holding.amount)}, ${holding.stepUpPct}% step-up, ${holding.tenureYears} yrs, ${holding.ratePct}% p.a.`;

  return (
    <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.planHeading}>
        <View style={styles.planTitle}>
          <AppText weight="semibold" style={typography.name}>{holding.name}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>{progressLabel}</AppText>
        </View>
        <View style={styles.planValue}>
          <AppText weight="bold" style={typography.amount}>{formatINR(currentValue)}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            {holding.actualValue === null ? 'Estimated value' : 'Actual value'}
          </AppText>
        </View>
      </View>
      <ProgressBar percent={progress} />
      <AppText style={[typography.meta, styles.planDescription, { color: colors.text2 }]}>
        Invested {formatINR(planInvested(holding))}. Plan: {formatINRShort(contributionPlan)} in contributions.
        {' '}{loggedCount(holding)} logged · {due} due so far.
      </AppText>
      {overdue > 0 ? (
        <AppText style={[typography.meta, { color: colors.err, marginTop: 4 }]}>{overdue} behind</AppText>
      ) : null}
      <ActionRow
        actions={[
          { label: 'Log installment', variant: 'primary', onPress: () => {
            // TODO(phase5)
          } },
          { label: `Logs (${loggedCount(holding)})`, onPress: () => {
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
