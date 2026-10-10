import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { SegmentedControl } from '../src/components/form/SegmentedControl';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { liabilitySummary } from '../src/domain/liability';
import { liabilitySchedule, type ScheduleRow, type ScheduleStatus } from '../src/domain/schedule';
import type { LiabilityPayment } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
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

export default function LiabilityPaymentsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const today = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((entry) => entry.id === liabilityId);
  const [tab, setTab] = useState<Tab>('Schedule');
  const schedule = useMemo(
    () => liability ? liabilitySchedule(liability, today) : null,
    [liability, today],
  );
  const payments = useMemo(
    () => liability ? [...liability.payments].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)) : [],
    [liability],
  );
  const listRows: ListRow[] = tab === 'Schedule' ? schedule?.rows ?? [] : payments;

  if (!liability || !schedule) {
    return <Screen><ScreenHeader title="Liability schedule" /><EmptyState title="Liability not found" /></Screen>;
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
      <ScreenHeader title={`${liability.name} ${tab === 'Schedule' ? 'schedule' : 'payments'}`} />
      <View style={styles.segment}>
        <SegmentedControl
          label="View"
          value={tab}
          options={[{ label: 'Schedule', value: 'Schedule' }, { label: 'Payments', value: 'Payments' }]}
          onChange={setTab}
        />
      </View>
      {tab === 'Schedule' ? (
        <>
          <Card>
            <AppText style={[typography.label, { color: colors.text3 }]}>Schedule summary</AppText>
            <AppText weight="semibold" style={styles.summaryLine}>
              {summary.cleared ? 'Cleared' : schedule.summary.nextDue
                ? `Next due ${formatDate(schedule.summary.nextDue.dueDate)} · ${formatINR(schedule.summary.nextDue.amount)}`
                : 'Schedule complete'}
            </AppText>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              Paid {schedule.summary.paid} · {schedule.summary.overdue} overdue · Balance {formatINR(summary.balance)}
            </AppText>
            {liability.kind === 'recurring' && schedule.neverClears
              ? <AppText style={[typography.meta, { color: colors.err, marginTop: 5 }]}>EMI does not cover monthly interest</AppText>
              : null}
            {liability.kind === 'recurring' && schedule.shortfall
              ? <AppText style={[typography.meta, { color: colors.err, marginTop: 5 }]}>Balance remains after the final scheduled EMI</AppText>
              : null}
          </Card>
          <View style={styles.addAction}>
            <Button label="Add payment" variant="primary" onPress={() => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } })} />
          </View>
        </>
      ) : (
        <>
          <Card>
            <AppText style={[typography.label, { color: colors.text3 }]}>Balance</AppText>
            <AppText weight="bold" style={[typography.big, styles.balance]}>{formatINR(summary.balance)}</AppText>
            <AppText style={[typography.meta, { color: colors.text3 }]}>Paid {formatINR(summary.paidTotal)} · Interest accrued {formatINR(summary.interestAccrued)}</AppText>
          </Card>
          <View style={styles.addAction}>
            <Button label="Add payment" variant="primary" onPress={() => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } })} />
          </View>
        </>
      )}
    </View>
  );

  return (
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
                  <AppText weight="bold" style={typography.amount}>{formatINR(item.amount)}</AppText>
                </View>
                <StatusBadge label={item.status} tone={badgeTone[item.status]} />
                {estimated && item.interest !== undefined ? (
                  <View style={styles.breakdown}>
                    <AppText style={[typography.meta, { color: colors.text3 }]}>Estimated · Interest {formatINR(item.interest)}</AppText>
                    <AppText style={[typography.meta, { color: colors.text3 }]}>Principal {formatINR(item.principal ?? 0)} · Balance after {formatINR(item.balanceAfter ?? 0)}</AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          }
          return (
            <Pressable onPress={() => openPayment(item)} style={[styles.row, { borderColor: colors.border }]}>
              <AppText weight="semibold">{formatDate(item.date)} · {item.kind}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{item.note}</AppText>
              <AppText weight="bold" style={typography.amount}>{formatINR(item.amount)}</AppText>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { paddingHorizontal: 20, marginTop: 6 },
  summaryLine: { marginTop: 7, fontSize: 12 },
  balance: { marginTop: 5 },
  addAction: { paddingHorizontal: 20, marginTop: 12 },
  listContent: { paddingBottom: 28 },
  row: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, gap: 3 },
  breakdown: { gap: 3, paddingTop: 2 },
});
