import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { SegmentedControl } from '../src/components/form/SegmentedControl';
import {
  AppText,
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { holdingInvested, holdingValue } from '../src/domain/portfolio';
import { planSchedule, type ScheduleRow, type ScheduleStatus } from '../src/domain/schedule';
import type { InvestmentEntry } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

type Tab = 'Schedule' | 'Entries';
type Filter = 'All' | 'Upcoming' | 'Ongoing' | 'Overdue' | 'Paid';
type ListRow = ScheduleRow | InvestmentEntry;

const filters: Filter[] = ['All', 'Upcoming', 'Ongoing', 'Overdue', 'Paid'];
const badgeTone: Record<ScheduleStatus, 'ok' | 'primary' | 'err' | 'neutral'> = {
  paid: 'ok',
  ongoing: 'primary',
  overdue: 'err',
  upcoming: 'neutral',
};

export default function InvestmentEntriesScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const today = useMemo(() => todayISO(), []);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const [tab, setTab] = useState<Tab>('Schedule');
  const [filter, setFilter] = useState<Filter>('All');
  const schedule = useMemo(
    () => holding?.kind === 'plan' ? planSchedule(holding, today) : null,
    [holding, today],
  );
  const entries = useMemo(
    () => holding ? [...holding.logs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)) : [],
    [holding],
  );
  const effectiveTab: Tab = holding?.kind === 'manual' ? 'Entries' : tab;
  const filteredSchedule = useMemo(() => {
    if (!schedule) return [];
    return filter === 'All'
      ? schedule.rows
      : schedule.rows.filter((row) => row.status === filter.toLowerCase());
  }, [filter, schedule]);
  const listRows: ListRow[] = effectiveTab === 'Schedule' ? filteredSchedule : entries;

  if (!holding) {
    return <Screen><ScreenHeader title="Investment entries" /><EmptyState title="Holding not found" /></Screen>;
  }

  const routeEntryForm = (row: ListRow) => {
    if ('status' in row) {
      if (row.status === 'paid' && row.entryId) {
        router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&entryId=${encodeURIComponent(row.entryId)}` as Href);
      } else if (row.status === 'ongoing' || row.status === 'overdue') {
        router.push(
          `/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&kind=Deposit&date=${encodeURIComponent(today)}&amount=${encodeURIComponent(String(row.amount))}` as Href,
        );
      }
      return;
    }
    router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&entryId=${encodeURIComponent(row.id)}` as Href);
  };

  const renderHeader = () => (
    <View>
      <ScreenHeader title={`${holding.name} ${effectiveTab === 'Schedule' ? 'schedule' : 'entries'}`} />
      {holding.kind === 'plan' ? (
        <View style={styles.segment}>
          <SegmentedControl
            label="View"
            value={effectiveTab}
            options={[{ label: 'Schedule', value: 'Schedule' }, { label: 'Entries', value: 'Entries' }]}
            onChange={setTab}
          />
        </View>
      ) : null}
      {effectiveTab === 'Schedule' && schedule ? (
        <>
          <Card>
            <AppText style={[typography.label, { color: colors.text3 }]}>Schedule summary</AppText>
            {schedule.summary.nextDue ? (
              <AppText weight="semibold" style={styles.summaryLine}>
                Next due {formatDate(schedule.summary.nextDue.dueDate)} · {formatINR(schedule.summary.nextDue.amount)}
              </AppText>
            ) : (
              <AppText weight="semibold" style={styles.summaryLine}>Completed</AppText>
            )}
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              Paid {schedule.summary.paid} of {schedule.rows.length} · {schedule.summary.overdue} overdue
            </AppText>
          </Card>
          <ChipRow>
            {filters.map((item) => {
              const count = item === 'All'
                ? schedule.rows.length
                : schedule.rows.filter((row) => row.status === item.toLowerCase()).length;
              return <Chip key={item} label={`${item} (${count})`} selected={filter === item} onPress={() => setFilter(item)} />;
            })}
          </ChipRow>
          <View style={styles.addAction}>
            <Button label="Add entry" variant="primary" onPress={() => router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}` as Href)} />
          </View>
        </>
      ) : (
        <>
          <Card>
            <AppText style={[typography.label, { color: colors.text3 }]}>Summary</AppText>
            <AppText style={styles.summaryLine}>Invested {formatINR(holdingInvested(holding))}</AppText>
            <AppText style={styles.summaryLine}>Current value {formatINR(holdingValue(holding, today))}</AppText>
            <AppText style={styles.summaryLine}>Total deposits {formatINR(holding.logs.filter((entry) => entry.kind === 'Deposit').reduce((sum, entry) => sum + entry.amount, 0))}</AppText>
            <AppText style={styles.summaryLine}>Total withdrawals {formatINR(holding.logs.filter((entry) => entry.kind === 'Withdrawal').reduce((sum, entry) => sum + entry.amount, 0))}</AppText>
          </Card>
          <View style={styles.addAction}>
            <Button label="Add entry" variant="primary" onPress={() => router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}` as Href)} />
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
        ListEmptyComponent={<EmptyState title={effectiveTab === 'Schedule' ? 'No scheduled installments' : 'No investment entries'} />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={9}
        renderItem={({ item }) => {
          if ('status' in item) {
            return (
              <Pressable
                accessibilityRole={item.status === 'upcoming' ? undefined : 'button'}
                disabled={item.status === 'upcoming'}
                onPress={() => routeEntryForm(item)}
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.rowTop}>
                  <View style={styles.rowTitle}>
                    <AppText weight="semibold">{formatDate(item.dueDate)}</AppText>
                    {item.status === 'paid' && item.paidOn ? (
                      <AppText style={[typography.meta, { color: colors.text3 }]}>Paid on {formatDate(item.paidOn)}</AppText>
                    ) : null}
                  </View>
                  <AppText weight="bold" style={typography.amount}>{formatINR(item.amount)}</AppText>
                </View>
                <StatusBadge label={item.status} tone={badgeTone[item.status]} />
              </Pressable>
            );
          }
          return (
            <View style={styles.row}>
              <AppText weight="semibold">{formatDate(item.date)} · {item.kind}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{item.note}</AppText>
              <AppText weight="bold" style={typography.amount}>{formatINR(item.amount)}</AppText>
              <Button label="Edit entry" onPress={() => routeEntryForm(item)} />
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { paddingHorizontal: 20, marginTop: 6 },
  summaryLine: { marginTop: 7, fontSize: 12 },
  addAction: { paddingHorizontal: 20, marginTop: 12 },
  listContent: { paddingBottom: 28 },
  row: { marginHorizontal: 20, marginTop: 8, padding: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, gap: 3 },
});
