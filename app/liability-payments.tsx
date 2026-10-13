import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { SegmentedControl } from '../src/components/form/SegmentedControl';
import {
  AppText,
  Card,
  ChipRow,
  DetailTabBar,
  EmptyState,
  Screen,
  StatusBadge,
} from '../src/components/ui';
import { AppHeader } from '../src/components/AppHeader';
import { ListRow as SharedListRow } from '../src/components/ListRow';
import { SortChip } from '../src/components/SortChip';
import { SectionHeaderRow } from '../src/components/SectionHeaderRow';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { liabilitySummary } from '../src/domain/liability';
import { liabilitySchedule, type ScheduleRow, type ScheduleStatus } from '../src/domain/schedule';
import type { LiabilityPayment } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatDate } from '../src/lib/format';
import { formatAmount } from '../src/lib/amountDisplay';
import { AmountText } from '../src/components/AmountText';
import { choiceAsync } from '../src/lib/confirm';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

type Tab = 'Schedule' | 'Payments';
type ListRow = ScheduleRow | LiabilityPayment;

const badgeTone: Record<ScheduleStatus, 'ok' | 'primary' | 'err' | 'neutral'> = {
  paid: 'ok',
  ongoing: 'primary',
  overdue: 'err',
  upcoming: 'neutral',
};

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityPaymentsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const actions = useAppActions();
  const scheduleSorting = useSort('schedules');
  const paymentSorting = useSort('payments');
  const today = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((entry) => entry.id === liabilityId);
  const [tab, setTab] = useState<Tab>('Schedule');
  const schedule = useMemo(
    () => liability ? liabilitySchedule(liability, today) : null,
    [liability, today],
  );
  const payments = useMemo(
    () => liability
      ? liability.payments
        .map((payment, sortCreatedIndex) => ({ ...payment, sortCreatedIndex }))
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      : [],
    [liability],
  );
  const listRows: ListRow[] = tab === 'Schedule'
    ? scheduleSorting.sort(schedule?.rows ?? [])
    : paymentSorting.sort(payments);

  if (!liability || !schedule) {
    return <Screen><AppHeader title="Liability schedule" showBack fallbackHref="/liabilities" /><EmptyState title="Liability not found" /></Screen>;
  }

  const openPayment = (row: ListRow) => {
    if ('status' in row) {
      if (row.status === 'paid' && row.entryId) {
        router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, paymentId: row.entryId } });
      } else if (row.status !== 'paid') {
        router.push({
          pathname: '/liability-payment-form',
          params: {
            liabilityId: liability.id,
            date: today,
            amount: String(row.amount),
            kind: liability.kind === 'recurring' ? 'EMI' : 'Payment',
            mode: liability.kind === 'recurring' ? 'emi' : undefined,
          },
        });
      }
    } else {
      router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, paymentId: row.id } });
    }
  };

  const summary = liabilitySummary(liability, today);
  const renderHeader = () => (
    <View>
      <AppHeader
        title={`${liability.name} ${tab === 'Schedule' ? 'schedule' : 'payments'}`}
        showBack
        fallbackHref="/liabilities"
        rightActions={[{
          icon: 'plus',
          label: 'Add liability payment',
          onPress: () => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } }),
        }]}
        menu={[
          ...(liability.kind === 'recurring' && schedule.summary.overdue + schedule.summary.ongoing > 0
            ? [{
              label: 'Clear past dues',
              icon: 'edit' as const,
              onPress: () => router.push(
                `/clear-dues?kind=liability&id=${encodeURIComponent(liability.id)}` as Href,
              ),
            }]
            : []),
          {
            label: 'Edit',
            icon: 'edit',
            onPress: () => router.push({ pathname: '/liability-form', params: { id: liability.id } }),
          },
          {
            label: 'Delete',
            icon: 'trash-2',
            destructive: true,
            onPress: () => {
              const linkedCount = data.transactions.filter((transaction) =>
                transaction.source?.kind === 'liability-payment' && transaction.source.parentId === liability.id,
              ).length;
              void choiceAsync({
                title: 'Delete liability?',
                message: `This removes ${liability.payments.length} payments and affects ${linkedCount} linked transactions.`,
                choices: [
                  { id: 'keep', label: 'Keep transactions' },
                  { id: 'delete', label: 'Delete everything', destructive: true },
                ],
              }).then((choice) => {
                if (choice !== 'keep' && choice !== 'delete') return;
                actions.deleteLiability(liability.id, { linkedTransactions: choice });
                if (!useAppStore.getState().lastError) router.back();
              });
            },
          },
        ]}
      />
      <View style={styles.segment}>
        <SegmentedControl
          label="View"
          value={tab}
          options={[{ label: 'Schedule', value: 'Schedule' }, { label: 'Payments', value: 'Payments' }]}
          onChange={setTab}
        />
      </View>
      <SectionHeaderRow
        title={tab}
        right={tab === 'Schedule'
          ? <SortChip options={SORT_OPTIONS.schedules} spec={scheduleSorting.spec} onChange={scheduleSorting.setSpec} />
          : <SortChip options={SORT_OPTIONS.payments} spec={paymentSorting.spec} onChange={paymentSorting.setSpec} />}
      />
      <ChipRow>
      </ChipRow>
      {tab === 'Schedule' ? (
        <>
          <Card>
            <AppText style={[typography.label, { color: colors.text3 }]}>Schedule summary</AppText>
            <AppText
              weight="semibold"
              style={styles.summaryLine}
              accessibilityLabel={summary.cleared
                ? 'Cleared'
                : schedule.summary.nextDue
                  ? `Next due ${formatDate(schedule.summary.nextDue.dueDate)}, ${formatAmount(schedule.summary.nextDue.amount, 'exact', 1)}`
                  : 'Schedule complete'}>
              {summary.cleared ? 'Cleared' : schedule.summary.nextDue
                ? <>Next due {formatDate(schedule.summary.nextDue.dueDate)} · <AmountText value={schedule.summary.nextDue.amount} tier="row" /></>
                : 'Schedule complete'}
            </AppText>
            <AppText
              style={[typography.meta, { color: colors.text3 }]}
              accessibilityLabel={`Paid ${schedule.summary.paid} · ${schedule.summary.overdue} overdue · Balance ${formatAmount(summary.balance, 'exact', 1)}`}>
              Paid {schedule.summary.paid} · {schedule.summary.overdue} overdue · Balance <AmountText value={summary.balance} tier="row" />
            </AppText>
            {liability.kind === 'recurring' && schedule.neverClears
              ? <AppText style={[typography.meta, { color: colors.err, marginTop: 5 }]}>EMI does not cover monthly interest</AppText>
              : null}
            {liability.kind === 'recurring' && schedule.shortfall
              ? <AppText style={[typography.meta, { color: colors.err, marginTop: 5 }]}>Balance remains after the final scheduled EMI</AppText>
              : null}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <AppText style={[typography.label, { color: colors.text3 }]}>Balance</AppText>
            <AmountText value={summary.balance} tier="hero" weight="bold" style={[typography.big, styles.balance]} />
            <AppText
              style={[typography.meta, { color: colors.text3 }]}
              accessibilityLabel={`Paid ${formatAmount(summary.paidTotal, 'exact', 1)} · Interest accrued ${formatAmount(summary.interestAccrued, 'exact', 1)}`}>
              Paid <AmountText value={summary.paidTotal} tier="row" /> · Interest accrued <AmountText value={summary.interestAccrued} tier="row" />
            </AppText>
          </Card>
        </>
      )}
    </View>
  );

  return (
    <>
    <Screen scroll={false}>
      <FlatList<ListRow>
        data={listRows}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState title={tab === 'Schedule' ? (summary.cleared ? 'Cleared' : 'No scheduled payments') : 'No payments recorded'} />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={9}
        renderItem={({ item }) => {
          if ('status' in item) {
            const estimated = liability.kind === 'recurring' && item.status !== 'paid';
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${formatDate(item.dueDate)}, ${formatAmount(item.amount, 'exact', 1)}, ${item.status}`}
                onPress={() => openPayment(item)}
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.rowTop}>
                  <View style={styles.rowTitle}>
                    <AppText weight="semibold">
                      {liability.kind === 'one-time' && liability.dueDate === null
                        ? 'No due date'
                        : formatDate(item.dueDate)}
                    </AppText>
                    {item.status === 'paid' && item.paidOn
                      ? <AppText style={[typography.meta, { color: colors.text3 }]}>Paid on {formatDate(item.paidOn)}</AppText>
                      : null}
                  </View>
                  <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
                </View>
                <StatusBadge label={item.status} tone={badgeTone[item.status]} />
                {estimated && item.interest !== undefined ? (
                  <View style={styles.breakdown}>
                    <AppText
                      style={[typography.meta, { color: colors.text3 }]}
                      accessibilityLabel={`Estimated · Interest ${formatAmount(item.interest, 'exact', 1)}`}>
                      Estimated · Interest <AmountText value={item.interest} tier="row" />
                    </AppText>
                    <AppText
                      style={[typography.meta, { color: colors.text3 }]}
                      accessibilityLabel={`Principal ${formatAmount(item.principal ?? 0, 'exact', 1)} · Balance after ${formatAmount(item.balanceAfter ?? 0, 'exact', 1)}`}>
                      Principal <AmountText value={item.principal ?? 0} tier="row" /> · Balance after <AmountText value={item.balanceAfter ?? 0} tier="row" />
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          }
          return (
            <SharedListRow
              style={[styles.row, { borderColor: colors.border }]}
              onPress={() => openPayment(item)}
              onEdit={() => openPayment(item)}
              editLabel="Edit liability payment"
              accessibilityLabel={`${formatDate(item.date)}, ${item.kind}, ${formatAmount(item.amount, 'exact', 1)}`}
            >
              <AppText weight="semibold">{formatDate(item.date)} · {item.kind}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{item.note}</AppText>
              <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
            </SharedListRow>
          );
        }}
      />
    </Screen>
    <DetailTabBar active="none" />
    </>
  );
}

const styles = StyleSheet.create({
  segment: { paddingHorizontal: 20, marginTop: 6 },
  summaryLine: { marginTop: 7, fontSize: 12 },
  balance: { marginTop: 5 },
  listContent: { paddingBottom: 120 },
  row: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, gap: 3 },
  breakdown: { gap: 3, paddingTop: 2 },
});
