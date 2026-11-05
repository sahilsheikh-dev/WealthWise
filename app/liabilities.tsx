import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { CardHeaderRow } from '../src/components/CardHeaderRow';
import { DueActions } from '../src/components/DueActions';
import { SortChip } from '../src/components/SortChip';
import {
  AppText,
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  ProgressBar,
  Screen,
  SearchField,
  StatPill,
  StatPillRow,
  StatusBadge,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { isLiabilityClosed, liabilitySummary, payoffDate } from '../src/domain/liability';
import { liabilitySchedule } from '../src/domain/schedule';
import { liabilitiesOverview } from '../src/domain/summary';
import type { OneTimeLiability, RecurringLiability } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatMonth } from '../src/lib/format';
import { DEFAULT_SORTS, SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const EXTRA_ERROR = 'Enter a whole number between 0 and 10,00,000';
const LIABILITY_FILTERS = ['All', 'Recurring', 'One-time', 'Closed'] as const;

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilitiesScreen() {
  const { colors } = useTheme();
  const data = useAppData();
  const sorting = useSort('liabilities');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<(typeof LIABILITY_FILTERS)[number]>('All');
  const [query, setQuery] = useState('');
  const asOf = todayISO();
  const [extraText, setExtraText] = useState('0');
  const hasRecurring = data.liabilities.some((liability) =>
    liability.kind === 'recurring' && !isLiabilityClosed(liability));
  const isValidExtra = /^\d+$/.test(extraText) && Number.isSafeInteger(Number(extraText))
    && Number(extraText) >= 0 && Number(extraText) <= 1_000_000;
  const extra = isValidExtra ? Number(extraText) : 0;
  const overview = liabilitiesOverview(data, asOf, extra);
  const liabilityCreationOrder = new Map(data.liabilities.map((liability, index) => [liability.id, index]));
  const sortedLiabilities = sorting.sort(data.liabilities.map((liability) => {
    const summary = liabilitySummary(liability, asOf);
    const schedule = liabilitySchedule(liability, asOf);
    return {
      ...liability,
      balance: summary.balance,
      sortEmi: liability.kind === 'recurring' ? liability.emi : null,
      nextDue: liability.kind === 'one-time' ? liability.dueDate : schedule.summary.nextDue?.dueDate,
      rate: liability.ratePct,
      progress: summary.principalPaidPct,
      status: summary.cleared ? 'cleared' : schedule.summary.overdue > 0 ? 'overdue' : 'active',
      sortCreatedIndex: liabilityCreationOrder.get(liability.id) ?? 0,
    };
  }));
  const filterActive = kindFilter !== 'All'
    || sorting.spec.key !== DEFAULT_SORTS.liabilities.key
    || sorting.spec.dir !== DEFAULT_SORTS.liabilities.dir;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLiabilities = sortedLiabilities.filter((liability) =>
    (kindFilter === 'Closed'
      ? liability.kind === 'recurring' && isLiabilityClosed(liability)
      : kindFilter === 'All'
        || (!isLiabilityClosed(liability)
          && (kindFilter === 'Recurring' ? liability.kind === 'recurring' : liability.kind === 'one-time')))
    && (!normalizedQuery || `${liability.name} ${liability.type}`.toLowerCase().includes(normalizedQuery)),
  );

  return (
      <Screen bottomPadding={120}>
        <AppHeader
          title="Liabilities"
          showBack
          fallbackHref="/(tabs)"
          rightActions={[
            {
              icon: 'filter',
              label: 'Filter',
              onPress: () => setFilterPanelOpen((open) => !open),
              expanded: filterPanelOpen,
              showIndicator: filterActive,
            },
            { icon: 'plus', label: 'Add a liability', onPress: () => router.push('/liability-form') },
          ]}
        />
        {filterPanelOpen ? (
          <View testID="liability-filter-panel">
            <ChipRow>
              <SortChip options={SORT_OPTIONS.liabilities} spec={sorting.spec} onChange={sorting.setSpec} />
              {LIABILITY_FILTERS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={kindFilter === item}
                  onPress={() => setKindFilter(item)}
                />
              ))}
            </ChipRow>
          </View>
        ) : null}
        <SearchField
          accessibilityLabel="Search liabilities"
          placeholder="Search name or type"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />
        <Card>
          <AppText style={[typography.label, { color: colors.text3 }]}>Total outstanding</AppText>
          <AmountText value={overview.totalOutstanding} tier="hero" weight="bold" style={[typography.big, styles.total]} />
          <AppText style={[typography.meta, { color: colors.err }]}>
            {overview.debtFreeBy === null
              ? 'No active recurring liabilities'
              : overview.debtFreeBy === 'never'
                ? 'At least one liability needs a higher EMI to clear'
                : `Debt-free by ${formatMonth(overview.debtFreeBy.slice(0, 7))}`}
          </AppText>
          <StatPillRow>
            <StatPill
              label="Monthly EMI"
              value={<AmountText value={overview.monthlyEmi} tier="tile" />}
              accessibilityLabel={`Monthly EMI, ${formatAmount(overview.monthlyEmi, 'exact', 1)}`}
              tone="err"
            />
            <StatPill label="Of income" value={overview.emiPctOfIncome === null ? '—' : `${overview.emiPctOfIncome.toFixed(1)}%`} />
          </StatPillRow>
          {overview.incomeSource === 'salary' ? (
            <AppText style={[typography.meta, { color: colors.text3 }]}>based on your stated monthly income</AppText>
          ) : null}
          {hasRecurring ? (
            <>
              <AppText weight="semibold" style={[typography.meta, styles.whatIfLabel, { color: colors.text2 }]}>
                What if I pay extra each month?
              </AppText>
              <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Extra monthly payment</AppText>
                <View style={styles.inputAmount}>
                  <AppText weight="semibold" style={[styles.rupee, { color: colors.text2 }]}>₹</AppText>
                  <TextInput
                    accessibilityLabel="Extra monthly payment"
                    keyboardType="number-pad"
                    value={extraText}
                    onChangeText={setExtraText}
                    style={[styles.extraInput, { color: colors.text1 }]}
                  />
                </View>
              </View>
              {!isValidExtra ? (
                <AppText accessibilityRole="alert" style={[typography.meta, styles.inputError, { color: colors.err }]}>
                  {EXTRA_ERROR}
                </AppText>
              ) : null}
            </>
          ) : null}
        </Card>

        {visibleLiabilities.map((liability) => liability.kind === 'recurring'
          ? <RecurringCard key={liability.id} liability={liability} asOf={asOf} extra={extra} />
          : <OneTimeCard key={liability.id} liability={liability} asOf={asOf} />)}
        {visibleLiabilities.length === 0 && (normalizedQuery.length > 0 || data.liabilities.length > 0) ? (
          <View testID="liability-no-matches">
            <EmptyState title="No matches" />
          </View>
        ) : data.liabilities.length === 0 ? (
          <>
            <EmptyState title="No liabilities yet" subtitle="Add a liability to track its outstanding balance." />
            <View style={styles.emptyAction}>
              <Button label="Add a liability" icon="plus" variant="primary" onPress={() => router.push('/liability-form')} />
            </View>
          </>
        ) : null}
      </Screen>
  );
}

function RecurringCard({ liability, asOf, extra }: { liability: RecurringLiability; asOf: string; extra: number }) {
  const { colors } = useTheme();
  const summary = liabilitySummary(liability, asOf, extra);
  const schedule = liabilitySchedule(liability, asOf);
  const scenarioDate = summary.monthsLeftWithExtra === null
    ? null
    : payoffDate(summary.monthsLeftWithExtra, asOf);
  return (
    <Pressable
      testID={`liability-card-${liability.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${isLiabilityClosed(liability) ? 'View' : 'Edit'} ${liability.name}`}
      accessibilityHint={isLiabilityClosed(liability) ? 'Opens this closed liability' : 'Opens this liability for editing'}
      onPress={() => router.push(isLiabilityClosed(liability)
        ? { pathname: '/liability-closure-note-form', params: { liabilityId: liability.id } }
        : { pathname: '/liability-form', params: { id: liability.id } })}
      style={[styles.liabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View testID={`liability-card-content-${liability.id}`}>
      <CardHeaderRow
        title={<AppText weight="semibold" style={typography.name}>{liability.name}</AppText>}
        subtitle={<AppText style={[typography.meta, { color: colors.text3 }]}>
            {liability.ratePct}% p.a. · {liability.tenureMonths} months · Since {formatDate(liability.startDate)}
        </AppText>}
        value={<AmountText value={summary.balance} tier="tile" weight="bold" style={typography.amount} />}
        valueCaption={(
          <AppText
            accessibilityLabel={`${formatAmount(liability.emi, 'exact', 1)} per month`}
            style={[typography.meta, { color: colors.err }]}>
            <AmountText value={liability.emi} tier="row" />/mo
          </AppText>
        )}
      />
      {!summary.cleared && schedule.summary.nextDue ? (
        <AppText
          accessibilityLabel={`Next: ${formatDate(schedule.summary.nextDue.dueDate)}, ${formatAmount(schedule.summary.nextDue.amount, 'exact', 1)}`}
          style={[typography.meta, { color: colors.text2, marginTop: 7 }]}>
          Next: {formatDate(schedule.summary.nextDue.dueDate)}, <AmountText value={schedule.summary.nextDue.amount} tier="row" />
        </AppText>
      ) : null}
      <AppText
        accessibilityLabel={`Paid ${formatAmount(summary.paidTotal, 'exact', 1)}. Interest accrued ${formatAmount(summary.interestAccrued, 'exact', 1)}.${
          summary.cleared
            ? ' Cleared'
            : summary.monthsLeft === null
              ? ' EMI is too low to clear this liability'
              : ` ${summary.monthsLeft} months left · Payoff ${formatMonth(payoffDate(summary.monthsLeft, asOf).slice(0, 7))}.`
        }`}
        style={[typography.meta, styles.liabilityStatus, { color: colors.text2 }]}>
        Paid <AmountText value={summary.paidTotal} tier="row" />. Interest accrued <AmountText value={summary.interestAccrued} tier="row" />.
        {'\n'}{isLiabilityClosed(liability)
          ? `Closed ${formatDate(liability.closure?.date ?? asOf)}`
          : summary.cleared
            ? 'Cleared'
          : summary.monthsLeft === null
            ? 'EMI is too low to clear this liability'
            : `${summary.monthsLeft} months left · Payoff ${formatMonth(payoffDate(summary.monthsLeft, asOf).slice(0, 7))}.`}
      </AppText>
      {!summary.cleared && schedule.summary.overdue > 0
        ? <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        : null}
      {!summary.cleared && extra > 0 ? (
        <AppText style={[typography.meta, styles.scenario, { color: colors.primary }]}>
          {scenarioDate === null
            ? 'Even this extra payment will not clear the liability'
            : summary.monthsSaved === null
              ? `With extra: ${summary.monthsLeftWithExtra} months · ${formatMonth(scenarioDate.slice(0, 7))}`
              : `With extra: ${summary.monthsLeftWithExtra} months · ${formatMonth(scenarioDate.slice(0, 7))} · saves ${summary.monthsSaved} months`}
        </AppText>
      ) : null}
      <ProgressBar percent={summary.principalPaidPct} tone="ok" />
      <View testID={`liability-card-actions-${liability.id}`}>
        {!isLiabilityClosed(liability) && schedule.summary.overdue + schedule.summary.ongoing > 0 ? (
          <DueActions
            target={{ kind: 'liability', id: liability.id }}
            pendingCount={schedule.summary.overdue + schedule.summary.ongoing}
            nextAmount={schedule.rows.find((row) => row.status === 'overdue' || row.status === 'ongoing')?.amount ?? 0}
            stopParentPress
          />
        ) : null}
        <View style={[styles.liabilityActions, { borderTopColor: colors.border }]}>
          {!summary.cleared && !isLiabilityClosed(liability) ? (
            <>
              <Button
                label="Pay EMI"
                icon="credit-card"
                variant="primary"
                style={styles.liabilityAction}
                onPress={(event) => { event?.stopPropagation(); router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, mode: 'emi' } }); }}
              />
              <Button
                label="Foreclosure"
                icon="check-circle"
                style={styles.liabilityAction}
                onPress={(event) => { event?.stopPropagation(); router.push({ pathname: '/liability-closure-form', params: { liabilityId: liability.id } }); }}
              />
            </>
          ) : isLiabilityClosed(liability) ? (
            <Button
              label="Edit closure note"
              icon="edit-2"
              style={styles.liabilityAction}
              onPress={(event) => { event?.stopPropagation(); router.push({ pathname: '/liability-closure-note-form', params: { liabilityId: liability.id } }); }}
            />
          ) : null}
          {liability.payments.length > 0 ? (
            <Button
              label="Entries"
              icon="list"
              style={styles.liabilityAction}
              onPress={(event) => { event?.stopPropagation(); router.push({ pathname: '/liability-payments', params: { id: liability.id } }); }}
            />
          ) : null}
        </View>
      </View>
      </View>
    </Pressable>
  );
}

function OneTimeCard({ liability, asOf }: { liability: OneTimeLiability; asOf: string }) {
  const { colors } = useTheme();
  const summary = liabilitySummary(liability, asOf);
  const schedule = liabilitySchedule(liability, asOf);
  const overdue = summary.overdueDays !== undefined && !summary.cleared;
  return (
    <Pressable
      testID={`liability-card-${liability.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${liability.name}`}
      accessibilityHint="Opens this liability for editing"
      onPress={() => router.push({ pathname: '/liability-form', params: { id: liability.id } })}
      style={[styles.liabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View testID={`liability-card-content-${liability.id}`}>
      <CardHeaderRow
        title={<AppText weight="semibold" style={typography.name}>{liability.name}</AppText>}
        subtitle={<AppText style={[typography.meta, { color: colors.text3 }]}>
            {liability.type} · {liability.ratePct}% p.a. · Since {formatDate(liability.startDate)}
        </AppText>}
        value={<AmountText value={summary.balance} tier="tile" weight="bold" style={typography.amount} />}
      />
      {!summary.cleared && schedule.summary.nextDue ? (
        <AppText
          accessibilityLabel={`Next: ${liability.dueDate ? formatDate(schedule.summary.nextDue.dueDate) : 'No due date'}, ${formatAmount(schedule.summary.nextDue.amount, 'exact', 1)}`}
          style={[typography.meta, { color: colors.text2, marginTop: 7 }]}>
          Next: {liability.dueDate ? formatDate(schedule.summary.nextDue.dueDate) : 'No due date'}, <AmountText value={schedule.summary.nextDue.amount} tier="row" />
        </AppText>
      ) : null}
      <AppText
        accessibilityLabel={`Due ${liability.dueDate ? formatDate(liability.dueDate) : 'No due date'} · Paid ${formatAmount(summary.paidTotal, 'exact', 1)}${overdue ? ` Overdue by ${summary.overdueDays} days` : ''}`}
        style={[typography.meta, styles.liabilityStatus, { color: colors.text2 }]}>
        Due {liability.dueDate ? formatDate(liability.dueDate) : 'No due date'} · Paid <AmountText value={summary.paidTotal} tier="row" />
        {overdue ? `\nOverdue by ${summary.overdueDays} days` : ''}
      </AppText>
      {!summary.cleared && schedule.summary.overdue > 0
        ? <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        : null}
      {overdue ? <AppText style={[typography.meta, { color: colors.err }]}>This liability is overdue.</AppText> : null}
      <ProgressBar percent={summary.principalPaidPct} tone="ok" />
      <View testID={`liability-card-actions-${liability.id}`}>
        <View style={[styles.liabilityActions, { borderTopColor: colors.border }]}>
          {!summary.cleared ? (
            <Button
              label="Pay EMI"
              icon="credit-card"
              variant="primary"
              style={styles.liabilityAction}
              onPress={(event) => { event?.stopPropagation(); router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } }); }}
            />
          ) : null}
          {liability.payments.length > 0 ? (
            <Button
              label="Entries"
              icon="list"
              style={styles.liabilityAction}
              onPress={(event) => { event?.stopPropagation(); router.push({ pathname: '/liability-payments', params: { id: liability.id } }); }}
            />
          ) : null}
        </View>
      </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  total: { marginTop: 5 },
  whatIfLabel: { marginTop: 16 },
  inputWrap: { minHeight: 48, marginTop: 7, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inputAmount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontSize: 13 },
  extraInput: { minWidth: 82, paddingVertical: 6, fontSize: 13, textAlign: 'right', fontFamily: 'Montserrat_600SemiBold' },
  inputError: { marginTop: 5 },
  liabilityCard: { marginHorizontal: 20, marginTop: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  liabilityStatus: { marginTop: 8, lineHeight: 18 },
  scenario: { marginTop: 7 },
  emptyAction: { marginHorizontal: 20, marginTop: 10 },
  sortRow: { marginHorizontal: 20, marginTop: 8 },
  liabilityActions: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'nowrap', gap: 6 },
  liabilityAction: { flex: 1, minWidth: 0 },
});
