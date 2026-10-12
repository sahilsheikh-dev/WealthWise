import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { AppHeader } from '../src/components/AppHeader';
import { InstrumentCard } from '../src/components/InstrumentCard';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { monthlyBaseline } from '../src/domain/ef';
import { buildInstrumentCardModel } from '../src/domain/instrumentCard';
import {
  buildPortfolioRows,
  filterRows,
  monthlyCommitment,
  portfolioTotals,
} from '../src/domain/portfolio';
import type { HoldingType } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatINR, formatINRShort } from '../src/lib/format';
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
  const rows = useMemo(() => buildPortfolioRows(data, asOf), [data, asOf]);
  const totals = portfolioTotals(rows);
  const visibleRows = filterRows(rows, filter);
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
          const model = cardModels.get(row.id);
          if (!model) throw new Error(`Instrument card model missing for "${row.id}".`);
          const holdingId = row.id;
          return (
            <InstrumentCard
              key={row.id}
              model={model}
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
