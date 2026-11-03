import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { AppText, Button, Card, Screen, StatusBadge } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { policySchedule } from '../src/domain/policySchedule';
import type { Policy, PolicyKind } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatDate } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { PaidAmountDialog } from '../src/components/PaidAmountDialog';

const kindTitles: Record<PolicyKind, string> = {
  'term-life': 'Term life',
  health: 'Health',
  'life-savings': 'Life savings',
  ulip: 'ULIP',
  motor: 'Motor',
  home: 'Home',
  other: 'Other',
};
export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function InsuranceScreen() {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const data = useAppData();
  const actions = useAppActions();
  const today = todayISO();
  const [policyPayment, setPolicyPayment] = useState<{ policy: Policy; dueAmount: number; dueDate: string } | null>(null);
  const placeholders = [
    { name: 'Term insurance', kind: 'term-life' as const },
    { name: 'Life insurance', kind: 'life-savings' as const },
  ].filter((placeholder) => !data.policies.some((policy) => policy.kind === placeholder.kind));

  const markPolicyPaid = async (policy: Policy) => {
    if (policy.status !== 'active') return;
    const nextDue = policySchedule(policy, today).rows.find((row) => row.status !== 'paid');
    if (!nextDue) {
      Alert.alert('No scheduled premium', 'This policy has no unpaid scheduled premiums.');
      return;
    }
    setPolicyPayment({ policy, dueAmount: nextDue.amount, dueDate: nextDue.dueDate });
  };

  const savePolicyPayment = (actualAmount: number) => {
    if (!policyPayment) return;
    const entryId = actions.clearDue(
      { kind: 'policy', id: policyPayment.policy.id },
      policySchedule(policyPayment.policy, today).rows.find((row) => row.status !== 'paid')?.id,
      actualAmount,
    );
    const state = useAppStore.getState();
    if (!entryId || state.lastError) {
      Alert.alert('Unable to mark premium paid', state.lastError ?? 'The payment could not be recorded.');
      return;
    }
    useUIStore.getState().setActionToast({
      message: `${formatAmount(actualAmount, 'exact', 1)} marked as paid`,
      actionLabel: 'Undo',
      onAction: () => {
        actions.undoClearDue({ kind: 'policy', id: policyPayment.policy.id }, entryId);
        const error = useAppStore.getState().lastError;
        if (error) Alert.alert('Unable to undo', error);
      },
    });
    setPolicyPayment(null);
  };

  return (
    <Screen>
      <PaidAmountDialog
        visible={policyPayment !== null}
        title={policyPayment?.policy.name ?? ''}
        dueAmount={policyPayment?.dueAmount ?? 0}
        dueDate={policyPayment?.dueDate}
        onPaid={savePolicyPayment}
        onNotPaid={() => setPolicyPayment(null)}
      />
      <AppHeader
        title="Insurance cover"
        showBack
        fallbackHref="/(tabs)"
        rightActions={[{ icon: 'plus', label: 'Add insurance', onPress: () => router.push('/policy-form') }]}
      />
      <View testID="insurance-policy-list">
        {placeholders.map((placeholder) => (
          <Card key={placeholder.kind}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add details for ${placeholder.name}`}
              onPress={() => router.push({
                pathname: '/policy-form',
                params: { kind: placeholder.kind, name: placeholder.name },
              })}>
              <AppText weight="semibold" style={typography.name}>{placeholder.name}</AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>Add details</AppText>
            </Pressable>
          </Card>
        ))}
        {data.policies.map((policy) => {
          const schedule = policySchedule(policy, today);
          const nextDue = schedule.rows.find((row) => row.status !== 'paid');
          return (
            <Card key={policy.id} style={styles.policyCard}>
              <Pressable
                testID={`policy-card-${policy.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${policy.name}, ${kindTitles[policy.kind]} policy`}
                accessibilityHint="Opens this policy for editing"
                onPress={() => router.push({ pathname: '/policy-form', params: { id: policy.id } })}>
                <View style={styles.policyHeading}>
                  <View style={styles.policyTitle}>
                    <AppText weight="semibold" style={typography.name}>{policy.name}</AppText>
                    <AppText style={[typography.meta, { color: colors.text3 }]}>{policy.insurer}</AppText>
                  </View>
                  {policy.status === 'active' ? null : <StatusBadge label="Ended" tone="neutral" />}
                </View>
                <DetailRow label="Type" value={kindTitles[policy.kind]} />
                <DetailRow
                  label="Premium"
                  value={<><AmountText value={policy.premium} tier="row" /> · {frequencyLabel(policy)}</>}
                />
                {policy.sumAssured === undefined ? null : (
                  <DetailRow label="Cover amount" value={<AmountText value={policy.sumAssured} tier="row" />} />
                )}
                <DetailRow label="Next due" value={nextDue ? formatDate(nextDue.dueDate) : '—'} last />
              </Pressable>
              {policy.status === 'active' ? (
                <View style={[
                  styles.policyActions,
                  fontScale >= 1.3 && styles.policyActionsStacked,
                  { borderTopColor: colors.border },
                ]}>
                  <Button
                    label="Paid"
                    disabled={!nextDue}
                    onPress={() => { void markPolicyPaid(policy); }}
                  />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

function DetailRow({ label, value, last = false }: {
  label: string;
  value: ReactNode;
  last?: boolean;
}) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[
      styles.detailRow,
      fontScale >= 1.3 && styles.detailRowStacked,
      !last && { borderBottomColor: colors.border },
    ]}>
      <AppText style={[typography.meta, { color: colors.text3 }]}>{label}</AppText>
      <AppText style={[
        typography.meta,
        styles.detailValue,
        fontScale >= 1.3 && styles.detailValueStacked,
      ]}>{value}</AppText>
    </View>
  );
}

function frequencyLabel(policy: Policy): string {
  if (policy.frequency === 'custom') return `Every ${policy.customIntervalMonths ?? 1} months`;
  const labels = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    'half-yearly': 'Half-yearly',
    yearly: 'Yearly',
  } as const;
  return labels[policy.frequency];
}

const styles = StyleSheet.create({
  detailRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  detailValue: { flex: 1, textAlign: 'right' },
  detailRowStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 2 },
  detailValueStacked: { textAlign: 'left' },
  policyCard: { gap: 4 },
  policyHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  policyTitle: { flex: 1, minWidth: 0 },
  policyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 8,
  },
  policyActionsStacked: { flexDirection: 'column', alignItems: 'stretch' },
});
