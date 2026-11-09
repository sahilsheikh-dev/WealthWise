import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { ListRow as SharedListRow } from '../src/components/ListRow';
import { SortChip } from '../src/components/SortChip';
import {
  AppText,
  Button,
  Card,
  ChipRow,
  EmptyState,
  Screen,
} from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { valueStaleness } from '../src/domain/holdingActions';
import { holdingCapabilities } from '../src/domain/holdingCapabilities';
import { holdingFinancialSummary, isCashOrBankHoldingType } from '../src/domain/portfolio';
import { planSchedule, type ScheduleRow } from '../src/domain/schedule';
import type { InvestmentEntry } from '../src/domain/types';
import { suggestedValuationMethod } from '../src/domain/valuation';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { choiceAsync } from '../src/lib/confirm';
import { formatDate } from '../src/lib/format';
import { SORT_OPTIONS, sortItems } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

type OpeningRow = { rowKind: 'opening'; id: string; amount: number };
type PendingPlanRow = Pick<ScheduleRow, 'id' | 'dueDate' | 'amount' | 'status'> & {
  rowKind: 'pending-plan';
  date: ScheduleRow['dueDate'];
};
type PaidInvestmentsHeaderRow = { rowKind: 'paid-investments-header'; id: string; count: number };
type ListRow = OpeningRow | PendingPlanRow | PaidInvestmentsHeaderRow | InvestmentEntry;

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function InvestmentEntriesScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const actions = useAppActions();
  const [paidInvestmentsExpanded, setPaidInvestmentsExpanded] = useState(false);
  const today = useMemo(() => todayISO(), []);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const capabilities = holding ? holdingCapabilities(holding.type) : null;
  const entrySortList = holding?.kind === 'plan' ? 'logs' : 'entries';
  const entrySorting = useSort(entrySortList);
  const entries = useMemo(
    () => holding
      ? holding.logs
        .map((entry, sortCreatedIndex) => ({ ...entry, sortCreatedIndex }))
        .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
      : [],
    [holding],
  );
  const recurringPlan = useMemo(
    () => holding?.kind === 'plan' && capabilities?.recurring ? planSchedule(holding, today) : null,
    [capabilities?.recurring, holding, today],
  );
  const scheduledPaidEntryIds = new Set(
    recurringPlan?.rows.flatMap((row) => row.entryId ? [row.entryId] : []) ?? [],
  );
  const paidInvestmentEntries = holding?.kind === 'plan' && recurringPlan
    ? entrySorting.sort(entries.filter((entry) => scheduledPaidEntryIds.has(entry.id)))
    : [];
  const otherEntries = entrySorting.sort(
    entries.filter((entry) => !scheduledPaidEntryIds.has(entry.id)),
  );

  if (!holding) {
    return <Screen><AppHeader title="Investment entries" showBack fallbackHref="/assets" /><EmptyState title="Holding not found" /></Screen>;
  }

  const financial = holdingFinancialSummary(holding, today);
  const cashOrBank = isCashOrBankHoldingType(holding.type);
  const method = holding.valuationMethod ?? suggestedValuationMethod(
    holding.type,
    holding.logs.some((entry) => entry.price !== undefined),
    holding.ratePct,
  );
  const valuationDate = method === 'unitsPrice'
    ? holding.priceAsOf
    : holding.kind === 'plan' ? holding.actualValueDate : holding.valueAsOf;
  const staleness = valueStaleness(valuationDate ?? undefined, today);
  const openingAmount = holding.kind === 'plan' ? holding.opening : holding.invested;
  const pendingPlanRows: PendingPlanRow[] = recurringPlan?.rows
    .filter((row) => row.status !== 'paid')
    .map(({ id, dueDate, amount, status }) => ({
      rowKind: 'pending-plan',
      id,
      dueDate,
      date: dueDate,
      amount,
      status,
    })) ?? [];
  const chronologicalRows = sortItems(
    [...pendingPlanRows, ...otherEntries],
    entrySortList,
    entrySorting.spec,
  );
  const paidInvestmentsHeader: PaidInvestmentsHeaderRow | null = paidInvestmentEntries.length > 0
    ? { rowKind: 'paid-investments-header', id: `paid-investments-${holding.id}`, count: paidInvestmentEntries.length }
    : null;
  const listRows: ListRow[] = [
    { rowKind: 'opening', id: `opening-${holding.id}`, amount: openingAmount },
    ...chronologicalRows,
    ...(paidInvestmentsHeader ? [paidInvestmentsHeader] : []),
    ...(paidInvestmentsExpanded ? paidInvestmentEntries : []),
  ];

  const routeEntryForm = (row: ListRow) => {
    if ('rowKind' in row) {
      router.push(`/investment-form?id=${encodeURIComponent(holding.id)}` as Href);
      return;
    }
    router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&entryId=${encodeURIComponent(row.id)}` as Href);
  };

  const renderHeader = () => (
    <View>
      <AppHeader
        title={`${holding.name} entries`}
        showBack
        fallbackHref="/assets"
        rightActions={!capabilities?.entries ? [{
          icon: 'plus',
          label: 'Record maturity payout',
          onPress: () => router.push(
            `/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&kind=Withdrawal` as Href,
          ),
        }] : undefined}
        menu={[
          ...(holding.kind === 'plan' && capabilities?.recurring && (recurringPlan?.summary.overdue ?? 0) + (recurringPlan?.summary.ongoing ?? 0) > 0
            ? [{
              label: 'Clear past dues',
              icon: 'check-circle' as const,
              onPress: () => router.push(`/clear-dues?kind=plan&id=${encodeURIComponent(holding.id)}` as Href),
            }]
            : []),
          {
            label: 'Edit',
            icon: 'edit-2',
            onPress: () => router.push(`/investment-form?id=${encodeURIComponent(holding.id)}` as Href),
          },
          {
            label: 'Delete',
            icon: 'trash-2',
            destructive: true,
            onPress: () => {
              const linkedCount = data.transactions.filter((transaction) =>
                transaction.source?.kind === 'holding-entry' && transaction.source.parentId === holding.id,
              ).length;
              void choiceAsync({
                title: 'Delete investment?',
                message: `This removes ${holding.logs.length} entries and affects ${linkedCount} linked transactions.`,
                choices: [
                  { id: 'keep', label: 'Keep transactions' },
                  { id: 'delete', label: 'Delete everything', destructive: true },
                ],
              }).then((choice) => {
                if (choice !== 'keep' && choice !== 'delete') return;
                if (holding.kind === 'plan') actions.deletePlan(holding.id, { linkedTransactions: choice });
                else actions.deleteHolding(holding.id, { linkedTransactions: choice });
                if (!useAppStore.getState().lastError) router.back();
              });
            },
          },
        ]}
      />
      <View style={styles.actions}>
        {capabilities?.entries ? (
          <Button
            label="Deposit"
            icon="plus"
            variant="primary"
            style={styles.action}
            onPress={() => router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&kind=Deposit` as Href)}
          />
        ) : null}
        <Button
          label="Withdraw"
          icon="arrow-down-left"
          style={styles.action}
          disabled={financial.value < 1}
          onPress={() => router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&kind=Withdrawal` as Href)}
        />
        {holding.kind === 'plan' && capabilities?.recurring ? (
          <Button
            style={styles.action}
            label={holding.stopDate ? 'Resume investment' : 'Stop investment'}
            icon={holding.stopDate ? 'play' : 'pause'}
            onPress={() => {
              if (holding.stopDate) {
                void choiceAsync({
                  title: 'Resume investment?',
                  message: 'This restores the plan schedule from the next due after today.',
                  choices: [
                    { id: 'cancel', label: 'Cancel' },
                    { id: 'resume', label: 'Resume', destructive: false },
                  ],
                }).then((choice) => {
                  if (choice === 'resume') actions.resumePlan(holding.id);
                });
              } else {
                router.push(`/recurring-plan-stop-form?id=${encodeURIComponent(holding.id)}` as Href);
              }
            }}
          />
        ) : null}
        <Button
          label={method === 'unitsPrice' ? 'Update price' : 'Update value'}
          icon="edit-2"
          style={styles.action}
          onPress={() => router.push(`/holding-valuation-form?id=${encodeURIComponent(holding.id)}` as Href)}
        />
      </View>
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Summary</AppText>
        {holding.kind === 'plan' && capabilities?.recurring ? (
          <>
            <AppText
              style={[typography.meta, styles.summaryLine, { color: colors.text2 }]}
              accessibilityLabel={`Recurring plan ${holding.frequency}, ${formatAmount(holding.amount, 'exact', 1)}, next due ${recurringPlan?.summary.nextDue?.dueDate ?? 'none'}`}>
              {holding.frequency[0]?.toUpperCase()}{holding.frequency.slice(1)} - <AmountText value={holding.amount} tier="row" />
            </AppText>
            <AppText style={[typography.meta, styles.summaryLine, { color: colors.text2 }]}>
              Next due {recurringPlan?.summary.nextDue ? formatDate(recurringPlan.summary.nextDue.dueDate) : 'None'}
            </AppText>
            <View testID="investment-month-counts" style={styles.summaryGrid}>
              <View testID="completed-investment-months-cell" style={[styles.summaryCell, styles.monthCountCell]}>
                <AppText style={[typography.label, { color: colors.text3 }]}>Completed months</AppText>
                <AppText
                  testID="completed-investment-months"
                  accessibilityLabel={`Completed ${recurringPlan?.summary.paid ?? 0} months`}
                  style={[typography.meta, styles.summaryValue]}>
                  {recurringPlan?.summary.paid ?? 0}
                </AppText>
              </View>
              <View testID="pending-investment-months-cell" style={[styles.summaryCell, styles.monthCountCell]}>
                <AppText style={[typography.label, { color: colors.text3 }]}>Pending months</AppText>
                <AppText
                  testID="pending-investment-months"
                  accessibilityLabel={`Pending ${pendingPlanRows.length} months`}
                  style={[typography.meta, styles.summaryValue]}>
                  {pendingPlanRows.length}
                </AppText>
              </View>
            </View>
            {holding.stopDate ? (
              <AppText style={[typography.meta, styles.summaryLine, { color: colors.text2 }]}>Recurring stopped on {formatDate(holding.stopDate)}</AppText>
            ) : null}
          </>
        ) : null}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>Invested</AppText>
            <AppText accessibilityLabel={`Invested ${formatAmount(financial.invested, 'exact', 1)}`} style={[typography.amount, styles.summaryValue]}>
              <AmountText value={financial.invested} tier="row" />
            </AppText>
          </View>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>{holding.valuationMethod === 'accrual' ? 'Estimated value' : cashOrBank ? 'Balance' : 'Current value'}</AppText>
            <AppText
              accessibilityLabel={`${cashOrBank ? 'Balance' : 'Current value'} ${formatAmount(financial.value, 'exact', 1)}`}
              style={[typography.amount, styles.summaryValue]}>
              <AmountText value={financial.value} tier="row" />
            </AppText>
          </View>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>Value date</AppText>
            <AppText style={[typography.meta, styles.summaryValue]}>
              {valuationDate ? `Updated ${staleness.days ?? 0} days ago` : 'Value date unknown'}
            </AppText>
          </View>
          {holdingCapabilities(holding.type).returns ? (
            <View style={styles.summaryCell}>
              <AppText style={[typography.label, { color: colors.text3 }]}>Gain</AppText>
              <AppText style={[typography.amount, styles.summaryValue]} accessibilityLabel={`Gain ${formatAmount(financial.gain, 'exact', 1)}`}>
                {financial.gain >= 0 ? '+' : '-'}<AmountText value={Math.abs(financial.gain)} tier="row" />
                <AppText style={[typography.meta, { color: colors.text2 }]}>{formatReturn(financial.returnSummary)}</AppText>
              </AppText>
            </View>
          ) : null}
        </View>
        {(holding.valuationMethod === 'manual' || holding.valuationMethod === 'unitsPrice') && staleness.stale
          ? <AppText style={[typography.meta, styles.summaryLine, { color: colors.err }]}>Value is over 90 days old</AppText>
          : null}
        {financial.ledger.costRecovered ? (
          <AppText style={[typography.meta, styles.summaryLine, { color: colors.text3 }]}>Cost recovered</AppText>
        ) : null}
      </Card>
      <ChipRow>
        <SortChip options={SORT_OPTIONS[entrySortList]} spec={entrySorting.spec} onChange={entrySorting.setSpec} />
      </ChipRow>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList<ListRow>
        data={listRows}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState title="No investment entries" />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={9}
        renderItem={({ item }) => {
          if ('rowKind' in item && item.rowKind === 'opening') {
            return (
              <SharedListRow
                style={[styles.row, { borderColor: colors.border }]}
                editLabel="Edit opening amount"
                onEdit={() => routeEntryForm(item)}
              >
                <AppText
                  accessibilityLabel={`Opening ${formatAmount(item.amount, 'exact', 1)}`}
                  weight="semibold">
                  Opening
                </AppText>
                <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
              </SharedListRow>
            );
          }
          if ('rowKind' in item && item.rowKind === 'pending-plan') {
            return (
              <SharedListRow
                style={[styles.row, { borderColor: colors.border }]}
                accessibilityLabel={`Pending investment ${formatDate(item.dueDate)}, ${formatAmount(item.amount, 'exact', 1)}`}
              >
                <AppText weight="semibold">{formatDate(item.dueDate)} · Pending investment</AppText>
                <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
              </SharedListRow>
            );
          }
          if ('rowKind' in item && item.rowKind === 'paid-investments-header') {
            return (
              <Pressable
                testID="paid-investments-toggle"
                accessibilityRole="button"
                accessibilityLabel={`Paid investments, ${item.count} entries`}
                accessibilityState={{ expanded: paidInvestmentsExpanded }}
                onPress={() => setPaidInvestmentsExpanded((expanded) => !expanded)}
                style={[styles.paidInvestmentsToggle, { borderColor: colors.border }]}
              >
                <AppText weight="semibold">Paid investments ({item.count})</AppText>
                <Feather
                  name={paidInvestmentsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            );
          }
          return (
            <SharedListRow
              style={[styles.row, { borderColor: colors.border }]}
              editLabel="Edit investment entry"
              onEdit={() => routeEntryForm(item)}
              accessibilityLabel={`${formatDate(item.date)}, ${item.kind}, ${formatAmount(item.amount, 'exact', 1)}`}
            >
              <AppText weight="semibold">{formatDate(item.date)} · {item.kind}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{item.note}</AppText>
              {item.price !== undefined ? <AppText style={[typography.meta, { color: colors.text3 }]}>Price per unit {formatAmount(item.price, 'exact', 1)}</AppText> : null}
              <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
            </SharedListRow>
          );
        }}
      />
    </Screen>
  );
}

function formatReturn(summary: ReturnType<typeof holdingFinancialSummary>['returnSummary']): string {
  const annualized = summary.annualizedLabel === 'XIRR' ? summary.xirr : summary.cagr;
  if (summary.annualizedLabel && annualized !== null) {
    return ` · ${summary.annualizedLabel} ${(annualized * 100).toFixed(1)}%`;
  }
  return summary.absoluteReturnPct === null
    ? ' · No return yet'
    : ` · ${summary.absoluteReturnPct.toFixed(1)}% absolute`;
}

const styles = StyleSheet.create({
  summaryLine: { marginTop: 7, fontSize: 12 },
  paidInvestmentsToggle: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actions: { paddingHorizontal: 20, marginTop: 6, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { flexGrow: 1, minWidth: 100 },
  summaryGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12 },
  summaryCell: { width: '48%', gap: 3 },
  monthCountCell: { width: 'auto', flex: 1, minWidth: 0 },
  summaryValue: { minHeight: 18 },
  listContent: { paddingBottom: 120 },
  row: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
});
