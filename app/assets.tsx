import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { AmountText } from '../src/components/AmountText';
import { InstrumentCard } from '../src/components/InstrumentCard';
import { SortChip } from '../src/components/SortChip';
import { SectionHeaderRow } from '../src/components/SectionHeaderRow';
import {
  AppText,
  Button,
  Card,
  Chip,
  ChipRow,
  DetailTabBar,
  EmptyState,
  Screen,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { monthlyBaseline } from '../src/domain/ef';
import { buildInstrumentCardModel } from '../src/domain/instrumentCard';
import {
  buildPortfolioRows,
  filterRows,
  monthlyCommitment,
  portfolioTotals,
} from '../src/domain/portfolio';
import { planSchedule } from '../src/domain/schedule';
import type { HoldingType } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatAmount } from '../src/lib/amountDisplay';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

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

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function AssetsScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const actions = useAppActions();
  const asOf = todayISO();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const assetSorting = useSort('assets');
  const sipSorting = useSort('sips');
  const rows = useMemo(() => buildPortfolioRows(data, asOf).map((row) => {
    if (row.kind !== 'plan' || row.holding?.kind !== 'plan') {
      return { ...row, nextDue: null, progress: null, status: null };
    }
    const schedule = planSchedule(row.holding, asOf);
    const status = schedule.summary.overdue > 0
      ? 'overdue'
      : schedule.summary.ongoing > 0
        ? 'ongoing'
        : schedule.summary.nextDue
          ? 'upcoming'
          : 'complete';
    return {
      ...row,
      nextDue: schedule.summary.nextDue?.dueDate ?? null,
      progress: schedule.rows.length === 0 ? null : schedule.summary.paid / schedule.rows.length * 100,
      status,
    };
  }), [data, asOf]);
  const totals = portfolioTotals(rows);
  const filteredRows = filterRows(rows, filter);
  const visibleRows = filter === 'Recurring'
    ? sipSorting.sort(filteredRows)
    : assetSorting.sort(filteredRows);
  const expenseBaseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const cardModels = useMemo(
    () => new Map(rows.map((row) => [row.id, buildInstrumentCardModel(row, {
      asOf,
      totalAssets: totals.value,
      monthlyExpenseBaseline: expenseBaseline,
      emergencyEntryCount: data.efEntries.length,
    })])),
    [asOf, data.efEntries.length, expenseBaseline, rows, totals.value],
  );
  const gainTone = totals.gain >= 0 ? colors.ok : colors.err;

  return (
    <>
    <Screen bottomPadding={120}>
      <AppHeader
        title="Assets"
        showBack
        fallbackHref="/(tabs)"
        rightActions={[{ icon: 'plus', label: 'New investment', onPress: () => router.push('/investment-form' as Href) }]}
      />
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Total value</AppText>
        <AmountText value={totals.value} tier="hero" weight="bold" style={[typography.big, styles.total]} />
        <AppText style={[typography.meta, { color: gainTone }]}>
          {totals.gain > 0 ? '+' : ''}<AmountText value={totals.gain} tier="row" />
          {totals.gainPct === null ? '' : ` (${totals.gainPct.toFixed(1)}% overall)`}
        </AppText>
        <StatPillRow>
          <StatPill label="Invested" value={formatAmount(totals.invested, 'tile', 1)} />
          <StatPill label="Gain" value={formatAmount(totals.gain, 'tile', 1)} tone={totals.gain >= 0 ? 'ok' : 'err'} />
          <StatPill label="Monthly SIP/RD" value={formatAmount(monthlyCommitment(data.holdings), 'tile', 1)} tone="primary" />
        </StatPillRow>
      </Card>

      <SectionHeaderRow
        title={filter === 'Recurring' ? 'SIPs and plans' : 'Assets'}
        right={(
          <SortChip
            options={filter === 'Recurring' ? SORT_OPTIONS.sips : SORT_OPTIONS.assets}
            spec={filter === 'Recurring' ? sipSorting.spec : assetSorting.spec}
            onChange={filter === 'Recurring' ? sipSorting.setSpec : assetSorting.setSpec}
          />
        )}
      />
      <ChipRow>
        {filters.map((item) => (
          <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </ChipRow>

      <View style={styles.holdingList}>
        {visibleRows.map((row) => {
          const model = cardModels.get(row.id);
          if (!model) throw new Error(`Instrument card model missing for "${row.id}".`);
          const holdingId = row.id;
          return (
            <InstrumentCard
              key={row.id}
              model={model}
              goalCount={data.goals.filter((goal) =>
                goal.links.some((link) => link.instrumentId === row.id)).length}
              dueTarget={row.kind === 'plan' ? { kind: 'plan', id: row.id } : undefined}
              onAction={(action) => {
                if (action === 'deposit') {
                  if (row.kind === 'auto-ef') router.push('/ef-entry-form?kind=Deposit');
                  else router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holdingId)}&kind=Deposit` as Href);
                } else if (action === 'withdraw') {
                  if (row.kind === 'auto-ef') router.push('/ef-entry-form?kind=Withdrawal');
                  else router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holdingId)}&kind=Withdrawal` as Href);
                } else if (action === 'schedule') {
                  router.push(`/investment-entries?id=${encodeURIComponent(holdingId)}` as Href);
                } else if (action === 'entries') {
                  if (row.kind === 'auto-ef') router.push('/emergency-fund');
                  else router.push(`/investment-entries?id=${encodeURIComponent(holdingId)}` as Href);
                } else if (action === 'edit') {
                  if (row.kind === 'auto-ef') {
                    const emergencyGoal = data.goals.find((goal) => goal.auto === 'ef');
                    if (!emergencyGoal) throw new Error('Emergency fund goal is missing.');
                    router.push({ pathname: '/goal-form', params: { id: emergencyGoal.id } });
                  } else {
                    router.push(`/investment-form?id=${encodeURIComponent(holdingId)}` as Href);
                  }
                } else if (action === 'confirm' && row.kind === 'manual') {
                  actions.confirmHoldingValue(row.id);
                }
              }}
            />
          );
        })}
        {visibleRows.length === 0 ? (
          <EmptyState title={data.holdings.length ? 'Nothing in this category yet' : 'No investments yet'} subtitle="Your holdings will appear here." />
        ) : null}
      </View>
      {data.holdings.length === 0 ? (
        <View style={styles.emptyAction}>
          <Button label="Add your first investment" icon="plus" variant="primary" onPress={() => router.push('/investment-form' as Href)} />
        </View>
      ) : null}
      <AppText style={[typography.meta, styles.note, { color: colors.text3 }]}>
        Plan values are estimates unless an actual value is supplied.
      </AppText>
    </Screen>
    <DetailTabBar active="Home" />
    </>
  );
}

const styles = StyleSheet.create({
  total: { marginTop: 5 },
  holdingList: { marginHorizontal: 20, marginTop: 12 },
  note: { marginHorizontal: 20, marginTop: 2, marginBottom: 16 },
  emptyAction: { marginHorizontal: 20, marginTop: 10 },
});
