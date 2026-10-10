import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, ListItem, Screen, ScreenHeader, SectionTitle } from '../src/components/ui';
import { holdingInvested, holdingValue } from '../src/domain/portfolio';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { useAppData } from '../src/data/useAppData';

export default function InvestmentEntriesScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const planId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const asOf = useMemo(() => todayISO(), []);
  const holding = data.holdings.find((item) => item.id === planId);
  if (!holding) return <Screen><ScreenHeader title="Investment entries" /><EmptyState title="Holding not found" /></Screen>;
  const entries = [...holding.logs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const deposits = holding.logs.filter((entry) => entry.kind === 'Deposit').reduce((sum, entry) => sum + entry.amount, 0);
  const withdrawals = holding.logs.filter((entry) => entry.kind === 'Withdrawal').reduce((sum, entry) => sum + entry.amount, 0);
  return (
    <Screen>
      <ScreenHeader title={`${holding.name} entries`} />
      <SectionTitle>Summary</SectionTitle>
      <View style={{ paddingHorizontal: 20, gap: 5 }}>
        <ListItem title="Invested" amount={formatINR(holdingInvested(holding))} />
        <ListItem title="Current value" amount={formatINR(holdingValue(holding, asOf))} />
        <ListItem title="Total deposits" amount={formatINR(deposits)} />
        <ListItem title="Total withdrawals" amount={formatINR(withdrawals)} />
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Button label="Add entry" variant="primary" onPress={() => router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}` as Href)} />
      </View>
      {entries.length ? entries.map((entry) => (
        <View key={entry.id} style={{ paddingHorizontal: 20 }}>
          <ListItem title={formatDate(entry.date)} subtitle={`${entry.kind}${entry.note ? ` · ${entry.note}` : ''}`} amount={formatINR(entry.amount)} onPress={() => router.push(`/investment-entry-form?holdingId=${encodeURIComponent(holding.id)}&entryId=${encodeURIComponent(entry.id)}` as Href)} />
        </View>
      )) : <EmptyState title="No investment entries" subtitle="Add your first deposit or withdrawal." />}
    </Screen>
  );
}
