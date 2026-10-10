import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, ListItem, Screen, ScreenHeader, StatPill, StatPillRow } from '../src/components/ui';
import { loanState } from '../src/domain/loan';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { useAppData } from '../src/data/useAppData';

export default function LoanPaymentsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loanId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const asOf = useMemo(() => todayISO(), []);
  const loan = data.loans.find((entry) => entry.id === loanId);
  if (!loan) return <Screen><ScreenHeader title="Loan payments" /><EmptyState title="Loan not found" /></Screen>;
  const state = loanState(loan, asOf);
  const payments = [...loan.payments].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return (
    <Screen>
      <ScreenHeader title={`${loan.name} payments`} />
      <StatPillRow>
        <StatPill label="Balance" value={formatINR(state.balance)} tone="err" />
        <StatPill label="Paid" value={formatINR(state.paidTotal)} tone="ok" />
        <StatPill label="Interest accrued" value={formatINR(state.interestAccrued)} />
      </StatPillRow>
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Button label="Add payment" variant="primary" onPress={() => router.push({ pathname: '/loan-payment-form', params: { loanId: loan.id } })} />
      </View>
      {payments.length ? payments.map((payment) => (
        <View key={payment.id} style={{ paddingHorizontal: 20 }}>
          <ListItem
            title={formatDate(payment.date)}
            subtitle={`${payment.kind ?? 'EMI'}${payment.note ? ` · ${payment.note}` : ''}`}
            amount={formatINR(payment.amount)}
            onPress={() => router.push({ pathname: '/loan-payment-form', params: { loanId: loan.id, paymentId: payment.id } })}
          />
        </View>
      )) : <EmptyState title="No payments recorded" subtitle="Add your first EMI or prepayment." />}
    </Screen>
  );
}
