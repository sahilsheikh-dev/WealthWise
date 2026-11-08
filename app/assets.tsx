import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { InstrumentCard } from '../src/components/InstrumentCard';
import { SortChip } from '../src/components/SortChip';
import {
  AppText,
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  Screen,
  StatPill,
  StatPillRow,
} from '../src/components/ui';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { buildInstrumentCardModel } from '../src/domain/instrumentCard';
import {
  buildPortfolioRows,
  filterRows,
  monthlyCommitment,
  portfolioTotals,
} from '../src/domain/portfolio';
import { planSchedule } from '../src/domain/schedule';
import type { HoldingType } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const filters: ('All' | 'Recurring' | HoldingType)[] = [
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
  const cardModels = useMemo(
    () => new Map(rows.map((row) => [row.id, buildInstrumentCardModel(row, {
      asOf,
      totalAssets: totals.value,
    })])),
    [asOf, rows, totals.value],
  );
  const gainTone = totals.gain >= 0 ? colors.ok : colors.err;

  return (
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
        <AppText
          style={[typography.meta, { color: gainTone }]}
          accessibilityLabel={`Gain ${formatAmount(totals.gain, 'exact', 1)}${totals.gainPct === null ? '' : ` (${totals.gainPct.toFixed(1)}% overall)`}`}>
          {totals.gain > 0 ? '+' : ''}<AmountText value={totals.gain} tier="row" />
          {totals.gainPct === null ? '' : ` (${totals.gainPct.toFixed(1)}% overall)`}
        </AppText>
        <StatPillRow>
          <StatPill
            label="Invested"
            value={<AmountText value={totals.invested} tier="tile" />}
            accessibilityLabel={`Invested, ${formatAmount(totals.invested, 'exact', 1)}`}
          />
          <StatPill
            label="Gain"
            value={<AmountText value={totals.gain} tier="tile" />}
            accessibilityLabel={`Gain, ${formatAmount(totals.gain, 'exact', 1)}`}
            tone={totals.gain >= 0 ? 'ok' : 'err'}
          />
          <StatPill
            label="Monthly SIP/RD"
            value={<AmountText value={monthlyCommitment(data.holdings)} tier="tile" />}
            accessibilityLabel={`Monthly SIP/RD, ${formatAmount(monthlyCommitment(data.holdings), 'exact', 1)}`}
            tone="primary"
          />
        </StatPillRow>
      </Card>

      <ChipRow>
        {<SortChip
          options={filter === 'Recurring' ? SORT_OPTIONS.sips : SORT_OPTIONS.assets}
          spec={filter === 'Recurring' ? sipSorting.spec : assetSorting.spec}
          onChange={filter === 'Recurring' ? sipSorting.setSpec : assetSorting.setSpec}
        />}
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
                  router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holdingId)}&kind=Deposit` as Href);
                } else if (action === 'withdraw') {
                  router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holdingId)}&kind=Withdrawal` as Href);
                } else if (action === 'schedule') {
                  router.push(`/investment-entries?id=${encodeURIComponent(holdingId)}` as Href);
                } else if (action === 'entries') {
                  router.push(`/investment-entries?id=${encodeURIComponent(holdingId)}` as Href);
                } else if (action === 'edit') {
                  router.push(`/investment-form?id=${encodeURIComponent(holdingId)}` as Href);
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
  );
}

const styles = StyleSheet.create({
  total: { marginTop: 5 },
  holdingList: { marginHorizontal: 20, marginTop: 12 },
  note: { marginHorizontal: 20, marginTop: 2, marginBottom: 16 },
  emptyAction: { marginHorizontal: 20, marginTop: 10 },
});
