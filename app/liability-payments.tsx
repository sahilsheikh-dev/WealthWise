import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { ListRow as SharedListRow } from '../src/components/ListRow';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Screen,
  StatusBadge,
} from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { isLiabilityClosed, liabilitySummary } from '../src/domain/liability';
import { liabilitySchedule, type ScheduleRow } from '../src/domain/schedule';
import type { LiabilityPayment } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { choiceAsync } from '../src/lib/confirm';
import { formatDate } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

type PendingEmiRow = Pick<ScheduleRow, 'id' | 'dueDate' | 'amount'> & { rowKind: 'pending-emi' };
type PaidEmisHeaderRow = { rowKind: 'paid-emis-header'; id: string; count: number };
type ListRow = PendingEmiRow | PaidEmisHeaderRow | LiabilityPayment;

export default function LiabilityPaymentsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const actions = useAppActions();
  const [paidEmisExpanded, setPaidEmisExpanded] = useState(false);
  const today = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((entry) => entry.id === liabilityId);
  const schedule = useMemo(
    () => liability ? liabilitySchedule(liability, today) : null,
    [liability, today],
  );
  const payments = useMemo(
    () => liability
      ? liability.payments
        .map((payment, sortCreatedIndex) => ({ ...payment, sortCreatedIndex }))
        .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
      : [],
    [liability],
  );
  const scheduledPaidPaymentIds = new Set(
    schedule?.rows.flatMap((row) => row.entryId ? [row.entryId] : []) ?? [],
  );
  const paidEmiPayments = liability?.kind === 'recurring'
    ? payments.filter((payment) => scheduledPaidPaymentIds.has(payment.id))
    : [];
  const otherPayments = payments.filter((payment) => !scheduledPaidPaymentIds.has(payment.id));

  if (!liability || !schedule) {
    return <Screen><AppHeader title="Liability entries" showBack fallbackHref="/liabilities" /><EmptyState title="Liability not found" /></Screen>;
  }

  const summary = liabilitySummary(liability, today);
  const closedDate = liability.kind === 'recurring' ? liability.closure?.date ?? today : today;
  const pendingEmiRows: PendingEmiRow[] = liability.kind === 'recurring' && !isLiabilityClosed(liability)
    ? schedule.rows
      .filter((row) => row.status !== 'paid')
      .map(({ id: rowId, dueDate, amount }) => ({ rowKind: 'pending-emi', id: rowId, dueDate, amount }))
    : [];
  const paidEmisHeader: PaidEmisHeaderRow | null = paidEmiPayments.length > 0
    ? { rowKind: 'paid-emis-header', id: `paid-emis-${liability.id}`, count: paidEmiPayments.length }
    : null;
  const listRows: ListRow[] = [
    ...pendingEmiRows,
    ...otherPayments,
    ...(paidEmisHeader ? [paidEmisHeader] : []),
    ...(paidEmisExpanded ? paidEmiPayments : []),
  ];
  const openPayment = (payment: LiabilityPayment) => {
    if (isLiabilityClosed(liability)) return;
    router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, paymentId: payment.id } });
  };

  const renderHeader = () => (
    <View>
      <AppHeader
        title={`${liability.name} entries`}
        showBack
        fallbackHref="/liabilities"
        rightActions={isLiabilityClosed(liability) ? [] : [{
          icon: 'plus',
          label: 'Add liability payment',
          onPress: () => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } }),
        }]}
        menu={[
          {
            label: 'Edit',
            icon: 'edit-2',
            onPress: () => router.push(isLiabilityClosed(liability)
              ? { pathname: '/liability-closure-note-form', params: { liabilityId: liability.id } }
              : { pathname: '/liability-form', params: { id: liability.id } }),
          },
          {
            label: 'Delete',
            icon: 'trash-2',
            destructive: true,
            onPress: () => {
              const linkedCount = data.transactions.filter((transaction) =>
                (transaction.source?.kind === 'liability-payment'
                  || transaction.source?.kind === 'liability-closure-charge'
                  || transaction.source?.kind === 'liability-origin')
                && transaction.source.parentId === liability.id,
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
      {!isLiabilityClosed(liability) ? (
        <View style={styles.actions}>
          <Button
            label="Pay EMI"
            icon="credit-card"
            variant="primary"
            style={styles.action}
            onPress={() => router.push({
              pathname: '/liability-payment-form',
              params: { liabilityId: liability.id, mode: liability.kind === 'recurring' ? 'emi' : undefined },
            })}
          />
          {liability.kind === 'recurring' ? (
            <Button
              label="Foreclosure"
              icon="check-circle"
              style={styles.action}
              onPress={() => router.push({ pathname: '/liability-closure-form', params: { liabilityId: liability.id } })}
            />
          ) : null}
        </View>
      ) : null}
      <Card>
        <AppText style={[typography.label, { color: colors.text3 }]}>Summary</AppText>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>Outstanding</AppText>
            <AmountText value={summary.balance} tier="row" weight="bold" style={[typography.amount, styles.summaryValue]} />
          </View>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>Paid</AppText>
            <AmountText value={summary.paidTotal} tier="row" weight="bold" style={[typography.amount, styles.summaryValue]} />
          </View>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>Interest accrued</AppText>
            <AmountText value={summary.interestAccrued} tier="row" weight="bold" style={[typography.amount, styles.summaryValue]} />
          </View>
          <View style={styles.summaryCell}>
            <AppText style={[typography.label, { color: colors.text3 }]}>Next due</AppText>
            <AppText style={[typography.meta, styles.summaryValue]}>
              {summary.cleared
                ? 'Cleared'
                : schedule.summary.nextDue
                  ? formatDate(schedule.summary.nextDue.dueDate)
                  : 'Schedule complete'}
            </AppText>
          </View>
        </View>
        {liability.kind === 'recurring' && isLiabilityClosed(liability) ? (
          <StatusBadge label={`Closed ${formatDate(closedDate)}`} tone="neutral" />
        ) : schedule.summary.overdue > 0 ? (
          <StatusBadge label={`${schedule.summary.overdue} overdue`} tone="err" />
        ) : null}
        {liability.kind === 'recurring' && schedule.neverClears ? (
          <AppText style={[typography.meta, styles.summaryNote, { color: colors.err }]}>EMI does not cover monthly interest</AppText>
        ) : null}
        {liability.kind === 'recurring' ? (
          <View style={styles.monthCounts}>
            <AppText testID="completed-emi-months" style={[typography.meta, { color: colors.text2 }]}>
              Completed {schedule.summary.paid} months
            </AppText>
            <AppText testID="pending-emi-months" style={[typography.meta, { color: colors.text2 }]}>
              Pending {pendingEmiRows.length} months
            </AppText>
          </View>
        ) : null}
      </Card>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList<ListRow>
        data={listRows}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState title="No entries recorded" />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={9}
        renderItem={({ item }) => {
          if ('rowKind' in item && item.rowKind === 'pending-emi') {
            return (
              <SharedListRow
                style={[styles.row, { borderColor: colors.border }]}
                accessibilityLabel={`Pending EMI ${formatDate(item.dueDate)}, ${formatAmount(item.amount, 'exact', 1)}`}
              >
                <AppText weight="semibold">{formatDate(item.dueDate)} · Pending EMI</AppText>
                <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
              </SharedListRow>
            );
          }
          if ('rowKind' in item && item.rowKind === 'paid-emis-header') {
            return (
              <Pressable
                testID="paid-emis-toggle"
                accessibilityRole="button"
                accessibilityLabel={`Paid EMIs, ${item.count} entries`}
                accessibilityState={{ expanded: paidEmisExpanded }}
                onPress={() => setPaidEmisExpanded((expanded) => !expanded)}
                style={[styles.paidEmisToggle, { borderColor: colors.border }]}
              >
                <AppText weight="semibold">Paid EMIs ({item.count})</AppText>
                <Feather
                  name={paidEmisExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            );
          }
          const content = (
            <>
              <AppText weight="semibold">{formatDate(item.date)} · {item.kind}</AppText>
              {item.note ? <AppText style={[typography.meta, { color: colors.text3 }]}>{item.note}</AppText> : null}
              <AmountText value={item.amount} tier="row" weight="bold" style={typography.amount} />
            </>
          );
          if (isLiabilityClosed(liability)) {
            return <View style={[styles.row, { borderColor: colors.border }]}>{content}</View>;
          }
          return (
            <SharedListRow
              style={[styles.row, { borderColor: colors.border }]}
              onPress={() => openPayment(item)}
              onEdit={() => openPayment(item)}
              editLabel="Edit liability payment"
              accessibilityLabel={`${formatDate(item.date)}, ${item.kind}, ${formatAmount(item.amount, 'exact', 1)}`}
            >{content}</SharedListRow>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: 20, marginTop: 6, marginBottom: 8, flexDirection: 'row', gap: 8 },
  action: { flexGrow: 1, minWidth: 100 },
  summaryGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12 },
  monthCounts: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  paidEmisToggle: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  summaryCell: { width: '48%', gap: 3 },
  summaryValue: { minHeight: 18 },
  summaryNote: { marginTop: 7 },
  listContent: { paddingBottom: 120 },
  row: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
});
