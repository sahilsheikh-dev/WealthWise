import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

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
import { liabilitySchedule } from '../src/domain/schedule';
import type { LiabilityPayment } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { choiceAsync } from '../src/lib/confirm';
import { formatDate } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityPaymentsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const actions = useAppActions();
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

  if (!liability || !schedule) {
    return <Screen><AppHeader title="Liability entries" showBack fallbackHref="/liabilities" /><EmptyState title="Liability not found" /></Screen>;
  }

  const summary = liabilitySummary(liability, today);
  const closedDate = liability.kind === 'recurring' ? liability.closure?.date ?? today : today;
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
              label="Close loan early"
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
      </Card>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList<LiabilityPayment>
        data={payments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState title="No entries recorded" />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={9}
        renderItem={({ item }) => {
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
  summaryCell: { width: '48%', gap: 3 },
  summaryValue: { minHeight: 18 },
  summaryNote: { marginTop: 7 },
  listContent: { paddingBottom: 120 },
  row: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
});
