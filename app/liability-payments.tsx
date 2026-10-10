import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, ListItem, Screen, ScreenHeader, StatPill, StatPillRow } from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { loanState } from '../src/domain/liability';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';

export default function LiabilityPaymentsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const asOf = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((entry) => entry.id === liabilityId);
  if (!liability) return <Screen><ScreenHeader title="Liability payments" /><EmptyState title="Liability not found" /></Screen>;
  const state = loanState(liability, asOf);
  const payments = [...liability.payments].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return (
    <Screen>
      <ScreenHeader title={`${liability.name} payments`} />
      <StatPillRow>
        <StatPill label="Balance" value={formatINR(state.balance)} tone="err" />
        <StatPill label="Paid" value={formatINR(state.paidTotal)} tone="ok" />
        <StatPill label="Interest accrued" value={formatINR(state.interestAccrued)} />
      </StatPillRow>
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Button label="Add payment" variant="primary" onPress={() => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id } })} />
      </View>
      {payments.length ? payments.map((payment) => (
        <View key={payment.id} style={{ paddingHorizontal: 20 }}>
          <ListItem
            title={formatDate(payment.date)}
            subtitle={`${payment.kind}${payment.note ? ` · ${payment.note}` : ''}`}
            amount={formatINR(payment.amount)}
            onPress={() => router.push({ pathname: '/liability-payment-form', params: { liabilityId: liability.id, paymentId: payment.id } })}
          />
        </View>
      )) : <EmptyState title="No payments recorded" subtitle={liability.kind === 'recurring' ? 'Add your first EMI or prepayment.' : 'Add the first payment.'} />}
    </Screen>
  );
}
