import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { AppText, Button, Card, Chip, ChipRow, EmptyState, ProgressBar, SearchField, Screen, StatusBadge } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { coverGoalSummaries } from '../src/domain/coverGoals';
import { policySchedule } from '../src/domain/policySchedule';
import { policySummary } from '../src/domain/policySummary';
import type { CoverPolicyType, Policy, PolicyKind, PolicyStatus } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatDate } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { PaidAmountDialog } from '../src/components/PaidAmountDialog';

const coverTypes: readonly CoverPolicyType[] = ['term-life', 'health', 'motor', 'home', 'other'];
const coverTitles: Record<CoverPolicyType, string> = {
  'term-life': 'Term life',
  health: 'Health',
  motor: 'Motor',
  home: 'Home',
  other: 'Other',
};
const policyKinds: readonly PolicyKind[] = [
  'term-life', 'health', 'life-savings', 'ulip', 'motor', 'home', 'other',
];
const kindTitles: Record<PolicyKind, string> = {
  'term-life': 'Term life',
  health: 'Health',
  'life-savings': 'Life savings',
  ulip: 'ULIP',
  motor: 'Motor',
  home: 'Home',
  other: 'Other',
};
const policyStatuses: readonly PolicyStatus[] = ['active', 'lapsed', 'matured', 'cancelled'];

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function InsuranceScreen() {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const data = useAppData();
  const actions = useAppActions();
  const today = todayISO();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | PolicyStatus>('All');
  const [kindFilter, setKindFilter] = useState<'All' | PolicyKind>('All');
  const [policyPayment, setPolicyPayment] = useState<{ policy: Policy; dueAmount: number; dueDate: string } | null>(null);
  const [query, setQuery] = useState('');
  const coverSummaries = coverGoalSummaries(data, today);
  const policyTotals = policySummary(data, today);
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePolicies = useMemo(() => data.policies.filter((policy) => {
    if (statusFilter !== 'All' && policy.status !== statusFilter) return false;
    if (kindFilter !== 'All' && policy.kind !== kindFilter) return false;
    const searchable = `${policy.name} ${policy.insurer} ${policy.policyNumber ?? ''} ${kindTitles[policy.kind]}`.toLowerCase();
    return !normalizedQuery || searchable.includes(normalizedQuery);
  }), [data.policies, kindFilter, normalizedQuery, statusFilter]);
  const filterActive = statusFilter !== 'All' || kindFilter !== 'All' || normalizedQuery.length > 0;

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
        rightActions={[
          {
            icon: 'filter',
            label: 'Filter',
            onPress: () => setFilterPanelOpen((open) => !open),
            expanded: filterPanelOpen,
            showIndicator: filterActive,
          },
          { icon: 'plus', label: 'Add policy', onPress: () => router.push('/policy-form') },
        ]}
      />
      {filterPanelOpen ? (
        <View testID="insurance-filter-panel" style={styles.filterPanel}>
          <AppText style={[typography.label, { color: colors.text2 }]}>Status</AppText>
          <ChipRow>
            <Chip label="All" selected={statusFilter === 'All'} onPress={() => setStatusFilter('All')} />
            {policyStatuses.map((status) => (
              <Chip
                key={status}
                label={status[0]?.toUpperCase() + status.slice(1)}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
              />
            ))}
          </ChipRow>
          <AppText style={[typography.label, { color: colors.text2 }]}>Kind</AppText>
          <ChipRow>
            <Chip label="All" selected={kindFilter === 'All'} onPress={() => setKindFilter('All')} />
            {policyKinds.map((kind) => (
              <Chip
                key={kind}
                label={kindTitles[kind]}
                selected={kindFilter === kind}
                onPress={() => setKindFilter(kind)}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}
      <SearchField
        accessibilityLabel="Search policies"
        placeholder="Search name, insurer, policy number or kind"
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
      />

      <View testID="insurance-cover-goals">
        {coverTypes.map((type) => {
          const summary = coverSummaries.find((item) => item.type === type);
          if (!summary) return null;
          const activePolicies = data.policies.filter((policy) =>
            summary.activePolicyIds.includes(policy.id),
          );
          const goal = data.coverGoals.find((item) => item.type === type);
          const percent = summary.target !== null
            ? summary.target > 0
              ? Math.min(100, summary.currentCover / summary.target * 100)
              : 100
            : goal?.targetMode === 'active-only' && activePolicies.length > 0 ? 100 : 0;
          const incomeLine = type === 'term-life' && policyTotals.yearlyIncomeEstimate !== null
            ? `Cover is ${policyTotals.coverMultiple?.toFixed(1) ?? '0'} times your yearly income of ${formatAmount(policyTotals.yearlyIncomeEstimate, 'exact', 1)}`
            : null;
          const targetText = goal?.targetMode === 'active-only'
            ? 'At least one active policy'
            : summary.target !== null
              ? formatAmount(summary.target, 'exact', 1)
              : goal?.targetMode === 'income-multiple' && goal.targetValue !== undefined
                ? `${goal.targetValue}x yearly income`
                : 'Set target';
          const shortPolicyNames = activePolicies.map((policy) => policy.name.length > 20
            ? `${policy.name.slice(0, 17)}...`
            : policy.name).join(', ');
          return (
            <Card key={type} style={styles.coverCard}>
              <Pressable
                testID={`cover-goal-card-${type}`}
                accessibilityRole="button"
                accessibilityLabel={`${coverTitles[type]} cover goal`}
                accessibilityHint="Opens cover target settings"
                onPress={() => router.push({ pathname: '/cover-goal-form', params: { type } })}>
                <AppText weight="semibold" style={typography.name}>{coverTitles[type]}</AppText>
                <DetailRow label="Target" value={targetText} />
                <DetailRow label="Current cover" value={<AmountText value={summary.currentCover} tier="row" />} />
                <DetailRow
                  label="Gap"
                  value={summary.gap === null ? '—' : <AmountText value={summary.gap} tier="row" />}
                />
                <DetailRow
                  label="Yearly premium"
                  value={<AmountText value={summary.yearlyPremium} tier="row" />}
                />
                <DetailRow
                  label="Next renewal"
                  value={summary.nextRenewal ? formatDate(summary.nextRenewal.date) : '—'}
                />
                <DetailRow
                  label="Policies"
                  value={shortPolicyNames || '—'}
                  last
                />
                {incomeLine ? (
                  <AppText testID="term-life-income-line" style={[typography.meta, styles.incomeLine]}>
                    {incomeLine}
                  </AppText>
                ) : null}
                <View testID={`cover-goal-progress-${type}`} style={styles.coverProgress}>
                  <ProgressBar percent={percent} />
                </View>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <View testID="insurance-policy-list">
        {data.policies.length === 0 ? (
          <Card>
            <EmptyState title="No policies yet" />
            <Button label="Add policy" icon="plus" variant="primary" onPress={() => router.push('/policy-form')} />
          </Card>
        ) : visiblePolicies.length === 0 ? (
          <EmptyState title="No matches" />
        ) : visiblePolicies.map((policy) => {
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
                  <StatusBadge label={policy.status[0]?.toUpperCase() + policy.status.slice(1)} tone="neutral" />
                </View>
                <DetailRow label="Kind" value={kindTitles[policy.kind]} />
                <DetailRow
                  label="Cover"
                  value={policy.sumAssured === undefined
                    ? 'Not specified'
                    : <AmountText value={policy.sumAssured} tier="row" />}
                />
                <DetailRow
                  label="Premium"
                  value={<><AmountText value={policy.premium} tier="row" /> · {policy.frequency}</>}
                />
                <DetailRow label="Next due" value={nextDue ? formatDate(nextDue.dueDate) : '—'} last />
              </Pressable>
              <View style={[
                styles.policyActions,
                fontScale >= 1.3 && styles.policyActionsStacked,
                { borderTopColor: colors.border },
              ]}>
                {policy.status === 'active' ? (
                  <Button
                    label="Paid"
                    disabled={!nextDue}
                    onPress={() => { void markPolicyPaid(policy); }}
                  />
                ) : null}
                <Button
                  label="Schedule"
                  onPress={() => router.push({
                    pathname: '/clear-dues',
                    params: { kind: 'policy', id: policy.id },
                  })}
                />
              </View>
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

const styles = StyleSheet.create({
  filterPanel: { gap: 7, marginBottom: 8 },
  coverCard: { paddingBottom: 13 },
  coverProgress: { marginTop: 12 },
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
  incomeLine: { marginTop: 7 },
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
