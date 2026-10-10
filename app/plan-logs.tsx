import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, Button, EmptyState, ListItem, Screen, ScreenHeader, SectionTitle } from '../src/components/ui';
import { behindBy, installmentsTracked, loggedTrackedCount, loggedTotal } from '../src/domain/sip';
import type { PlanHolding } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { formatDate, formatINR } from '../src/lib/format';
import { useAppData } from '../src/data/useAppData';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export default function PlanLogsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const planId = Array.isArray(id) ? id[0] : id;
  const data = useAppData();
  const asOf = useMemo(() => todayISO(), []);
  const { colors } = useTheme();
  const plan = data.holdings.find((holding) => holding.id === planId && holding.kind === 'plan') as PlanHolding | undefined;
  if (!plan) return <Screen><ScreenHeader title="Plan logs" /><EmptyState title="Plan not found" /></Screen>;
  const logs = [...plan.logs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return (
    <Screen>
      <ScreenHeader title={`${plan.name} logs`} />
      <SectionTitle>Summary</SectionTitle>
      <View style={{ paddingHorizontal: 20, gap: 5 }}>
        <ListItem title="Invested" amount={formatINR(loggedTotal(plan))} />
        <AppText style={[typography.meta, { color: colors.text2 }]}>
          {loggedTrackedCount(plan)} logged since tracking began, {installmentsTracked(plan, asOf)} due
        </AppText>
        <ListItem title="Tracked due" amount={String(installmentsTracked(plan, asOf))} />
        <ListItem title="Behind" amount={String(behindBy(plan, asOf))} />
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Button label="Add log" variant="primary" onPress={() => router.push({ pathname: '/plan-log-form', params: { planId: plan.id } })} />
      </View>
      {logs.length ? logs.map((log) => (
        <View key={log.id} style={{ paddingHorizontal: 20 }}>
          <ListItem title={formatDate(log.date)} subtitle={log.note || 'Installment'} amount={formatINR(log.amount)} onPress={() => router.push({ pathname: '/plan-log-form', params: { planId: plan.id, logId: log.id } })} />
        </View>
      )) : <EmptyState title="No installments logged" subtitle="Add your first installment log." />}
    </Screen>
  );
}
