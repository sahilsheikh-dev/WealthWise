import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AmountText } from '../../src/components/AmountText';
import { AppHeader } from '../../src/components/AppHeader';
import { DueActions } from '../../src/components/DueActions';
import { SortChip } from '../../src/components/SortChip';
import { AppText, Button, Card, ChipRow, EmptyState, ProgressBar, Screen, SectionTitle, StatusBadge } from '../../src/components/ui';
import { useAppStore } from '../../src/data/store';
import { useAppActions, useAppData } from '../../src/data/useAppData';
import { useSort } from '../../src/data/useSort';
import type { BudgetCommitment } from '../../src/domain/budget';
import { budgetMonthView } from '../../src/domain/budget';
import { reviewableMonths } from '../../src/domain/cashFlow';
import { shiftMonth } from '../../src/domain/dates';
import { efBalance } from '../../src/domain/ef';
import { formatAmount } from '../../src/lib/amountDisplay';
import { todayISO } from '../../src/lib/clock';
import { confirmAsync } from '../../src/lib/confirm';
import { formatDate, formatMonth } from '../../src/lib/format';
import { SORT_OPTIONS } from '../../src/lib/sorting';
import { swipeIntent } from '../../src/lib/swipe';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function BudgetScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const initialMonth = typeof params.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month)
    ? params.month : todayISO().slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  const [applyOpen, setApplyOpen] = useState(false);
  const [touchingHeader, setTouchingHeader] = useState(false);
  const data = useAppData();
  const actions = useAppActions();
  const { colors } = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const sorting = useSort('budgetSpending');
  const today = todayISO();
  const view = useMemo(() => budgetMonthView(data, month), [data, month]);
  const reviewableMonth = useMemo(() => reviewableMonths(data, today)[0], [data, today]);
  const templates = data.budgetTemplates ?? [];
  const stackMetrics = width < 360 || fontScale >= 1.8;
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      !touchingHeader && swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx }) !== null,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, gesture) => {
      const intent = swipeIntent({ dx: gesture.dx, dy: gesture.dy, vx: gesture.vx });
      if (intent) setMonth(shiftMonth(month, intent === 'next' ? 1 : -1));
    },
  }), [month, touchingHeader]);

  const apply = async (templateId: string) => {
    if (view.budget) {
      const confirmed = await confirmAsync({
        title: 'Replace this month’s plan?',
        message: 'Applying a template replaces the saved plan for this month.',
        confirmLabel: 'Apply template',
      });
      if (!confirmed) return;
    }
    actions.applyTemplateToMonth({ month, templateId });
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not apply template', error);
      return;
    }
    setApplyOpen(false);
  };

  const lines = sorting.sort(view.lines);
  return (
    <Screen scroll={false}>
      <View style={styles.gestureSurface} {...panResponder.panHandlers}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Budget" menu={[
            { icon: 'database', label: 'Budget templates', onPress: () => router.push('/budget-templates') },
          ]} />
          <View
            onTouchStart={() => setTouchingHeader(true)}
            onTouchEnd={() => setTouchingHeader(false)}
            onTouchCancel={() => setTouchingHeader(false)}
            style={styles.monthHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))}>
              <Feather name="chevron-left" size={22} color={colors.text2} />
            </Pressable>
            <AppText weight="semibold" style={typography.name}>{formatMonth(month)}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(shiftMonth(month, 1))}>
              <Feather name="chevron-right" size={22} color={colors.text2} />
            </Pressable>
          </View>
          <View testID="budget-quick-actions" style={[styles.quickActions, stackMetrics ? styles.quickActionsStacked : undefined]}>
            <BudgetQuickAction
              label="History"
              icon="calendar"
              stacked={stackMetrics}
              testID="budget-history-action"
              onPress={() => router.push('/budget-history')}
            />
            <BudgetQuickAction
              testID="budget-month-review-action"
              label="Month review"
              accessibilityLabel={reviewableMonth
                ? `Month review, ${formatMonth(reviewableMonth.month)} needs review`
                : 'Month review'}
              icon="calendar"
              stacked={stackMetrics}
              showIndicator={Boolean(reviewableMonth)}
              onPress={() => router.push(reviewableMonth
                ? { pathname: '/month-review', params: { month: reviewableMonth.month } }
                : '/month-review')}
            />
          </View>

          <Card>
            <AppText weight="bold" style={[typography.name, styles.cashFlowTitle]}>Cash flow</AppText>
            <View style={[styles.cashFlowMetrics, stackMetrics && styles.cashFlowMetricsStacked]}>
              <CashFlowMetric label="Opening balance" value={view.position.opening} />
              <CashFlowMetric
                label="This month’s flow"
                value={view.position.flow}
                negativeStatus="Net outflow"
                positiveStatus="Net inflow"
              />
            </View>
            <View style={[styles.previousPosition, stackMetrics && styles.previousPositionStacked, { borderTopColor: colors.border }]}>
              <View style={styles.previousPositionText}>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Previous month {view.position.previousClosing < 0
                    ? 'deficit'
                    : view.position.previousClosing > 0 ? 'surplus' : 'balanced'}
                </AppText>
                <AmountText
                  value={Math.abs(view.position.previousClosing)}
                  tier="row"
                  weight="semibold"
                  tone={view.position.previousClosing < 0 ? 'err' : 'neutral'}
                />
              </View>
              <Button
                label="Review"
                icon="arrow-right"
                accessibilityHint="Opens the previous month review"
                onPress={() => router.push({ pathname: '/month-review', params: { month: shiftMonth(month, -1) } })}
                style={[styles.reviewButton, stackMetrics && styles.reviewButtonStacked]}
              />
            </View>
            <View style={[styles.closingPosition, stackMetrics && styles.closingPositionStacked, { borderTopColor: colors.border }]}>
              <View style={styles.closingPositionLabel}>
                <AppText weight="semibold">Closing balance</AppText>
                {view.position.closing < 0 ? (
                  <AppText style={[typography.meta, { color: colors.err }]}>Deficit</AppText>
                ) : null}
              </View>
              <AmountText
                value={view.position.closing}
                tier="tile"
                weight="bold"
                tone={view.position.closing < 0 ? 'err' : 'primary'}
                style={styles.closingAmount}
              />
            </View>
          </Card>

          {!view.budget ? (
            <Card>
              <EmptyState title="No budget for this month" subtitle="Apply a template to create this month’s spending plan." />
              <Button label="Apply template" icon="check" variant="primary" onPress={() => setApplyOpen(true)} />
            </Card>
          ) : (
            <Card>
              <Pressable
                testID="budget-plan-summary-edit"
                accessibilityRole="button"
                accessibilityLabel={`Edit budget plan for ${formatMonth(month)}. Planned income ${view.plannedIncome === null ? 'unavailable' : formatAmount(view.plannedIncome, 'exact', 1)}, planned spending ${formatAmount(view.plannedSpend, 'exact', 1)}, planned savings ${formatAmount(view.plannedSave, 'exact', 1)}, unallocated ${view.unallocated === null ? 'unavailable' : formatAmount(view.unallocated, 'exact', 1)}`}
                accessibilityHint="Opens the selected month’s budget editor"
                onPress={() => router.push({ pathname: '/budget-month-form', params: { month } })}
                style={styles.planSummaryAction}>
                <View style={styles.planSummaryHeader}>
                  <AppText weight="semibold">Plan summary</AppText>
                  {view.budget.customized ? <StatusBadge label="Customized" tone="primary" /> : null}
                </View>
                <View style={[styles.planMetrics, stackMetrics && styles.planMetricsStacked]}>
                  <PlanMetric label="Planned income" value={view.plannedIncome} />
                  <PlanMetric label="Planned spending" value={view.plannedSpend} />
                  <PlanMetric label="Planned savings" value={view.plannedSave} />
                  <PlanMetric label="Unallocated" value={view.unallocated} />
                </View>
              </Pressable>
              <Button label="Apply template" onPress={() => setApplyOpen(true)} />
            </Card>
          )}

          <SectionTitle>Bills and dues</SectionTitle>
          {view.commitments.length ? view.commitments.map((item, index) => (
            <CommitmentCard
              key={`${item.kind}:${item.id}:${item.dueDate}:${index}`}
              item={item}
              rows={view.commitments}
              today={today}
            />
          )) : <Card><AppText style={{ color: colors.text3 }}>No scheduled bills or dues this month.</AppText></Card>}
          <Card>
            <AppText style={typography.meta}>Reminders are off · <AppText weight="semibold">Manage reminders</AppText></AppText>
          </Card>

          {view.budget ? (
            <>
              <ChipRow>
                <SortChip options={SORT_OPTIONS.budgetSpending} spec={sorting.spec} onChange={sorting.setSpec} />
              </ChipRow>
              {lines.filter((line) => !['EMI', 'Insurance'].includes(line.category)
                && !['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Emergency fund', 'Other investments'].includes(line.category))
                .map((line) => (
                  <BudgetLineCard
                    key={line.category}
                    category={line.category}
                    planned={line.planned}
                    actual={line.actual}
                    usedPct={line.usedPct}
                    status={line.status}
                    month={month}
                  />
                ))}
              <SectionTitle>Savings and investments</SectionTitle>
              {lines.filter((line) =>
                ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Emergency fund', 'Other investments'].includes(line.category))
                .map((line) => (
                  <BudgetLineCard
                    key={line.category}
                    category={line.category}
                    planned={line.planned}
                    actual={line.actual}
                    usedPct={line.usedPct}
                    status={line.status}
                    month={month}
                  />
                ))}
              <Pressable accessibilityRole="button" accessibilityLabel="Open Emergency fund" onPress={() => router.push('/emergency-fund')}>
                <Card>
                  <BudgetStat label="Emergency fund balance" value={efBalance(data.efEntries)} />
                  <AppText style={typography.meta}>Manage your Emergency fund</AppText>
                </Card>
              </Pressable>
              <SectionTitle>Debt repayments</SectionTitle>
              <Card>
                <BudgetStat label="EMIs planned" value={view.debt.emiPlanned} />
                <BudgetStat label="EMIs paid" value={view.debt.emiActual} />
                <BudgetStat label="Prepayments" value={view.debt.prepaymentsActual} />
              </Card>
              <SectionTitle>Insurance</SectionTitle>
              <Card>
                <BudgetStat label="Premiums planned" value={view.commitments.filter((row) => row.kind === 'policy').reduce((sum, row) => sum + row.plannedAmount, 0)} />
                <BudgetStat label="Premiums paid" value={view.commitments.filter((row) => row.kind === 'policy').reduce((sum, row) => sum + row.paidAmount, 0)} />
              </Card>
              <SectionTitle>Unbudgeted spending</SectionTitle>
              <Card><BudgetStat label="Unbudgeted" value={view.unbudgeted} /></Card>
              <SectionTitle>Outstanding at month end</SectionTitle>
              <Card><BudgetStat label={`${view.outstanding.count} overdue dues`} value={view.outstanding.amount} /></Card>
            </>
          ) : null}
        </ScrollView>
      </View>
      <Modal visible={applyOpen} transparent animationType="fade" onRequestClose={() => setApplyOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText weight="bold" style={typography.h1}>Apply a template</AppText>
            <Button label="Set up from 50/30/20" icon="plus" variant="primary" onPress={() => {
              setApplyOpen(false);
              router.push({ pathname: '/budget-template-form', params: { wizard: '1' } });
            }} />
            {templates.map((template) => (
              <Button key={template.id} label={template.name} onPress={() => void apply(template.id)} />
            ))}
            {templates.length === 0 ? <AppText style={{ color: colors.text3 }}>No templates yet. Set up a budget to get started.</AppText> : null}
            <Button label="Manage templates" onPress={() => { setApplyOpen(false); router.push('/budget-templates'); }} />
            <Button label="Close" onPress={() => setApplyOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function BudgetQuickAction({
  label,
  icon,
  onPress,
  stacked,
  showIndicator = false,
  testID,
  accessibilityLabel,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  stacked: boolean;
  showIndicator?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={[styles.quickActionButton, stacked ? styles.quickActionButtonStacked : undefined, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Feather name={icon} size={14} color={colors.text2} />
      <AppText weight="semibold" style={[typography.chip, styles.quickActionLabel, { color: colors.text2 }]}>{label}</AppText>
      <View style={styles.quickActionIndicatorSlot}>
        {showIndicator ? (
          <View testID="budget-month-review-dot" style={[styles.quickReviewDot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

function CashFlowMetric({
  label,
  value,
  negativeStatus = 'Deficit',
  positiveStatus,
}: {
  label: string;
  value: number;
  negativeStatus?: string;
  positiveStatus?: string;
}) {
  const { colors } = useTheme();
  const status = value < 0 ? negativeStatus : value > 0 ? positiveStatus : undefined;
  return (
    <View style={styles.cashFlowMetric}>
      <AppText style={[typography.meta, { color: colors.text3 }]}>{label}</AppText>
      <AmountText value={value} tier="tile" weight="semibold" tone={value < 0 ? 'err' : 'neutral'} />
      {status ? (
        <AppText style={[typography.meta, { color: value < 0 ? colors.err : colors.text3 }]}>{status}</AppText>
      ) : null}
    </View>
  );
}

function PlanMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.planMetric}>
      <AppText style={typography.meta}>{label}</AppText>
      {value === null
        ? <AppText weight="semibold">—</AppText>
        : <AmountText value={value} tier="row" weight="semibold" />}
    </View>
  );
}

function BudgetStat({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.statRow}>
      <AppText>{label}</AppText>
      <AppText
        weight={bold ? 'bold' : 'medium'}
        accessibilityLabel={`${label}, ${formatAmount(value, 'exact', 1)}`}>
        <AmountText value={value} tier="row" weight={bold ? 'bold' : 'medium'} />
      </AppText>
    </View>
  );
}

function CommitmentCard({ item, rows, today }: { item: BudgetCommitment; rows: BudgetCommitment[]; today: string }) {
  const { colors } = useTheme();
  const pending = rows.filter((row) => row.kind === item.kind && row.id === item.id
    && row.dueDate <= today && row.status !== 'paid');
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.category}, due ${formatDate(item.dueDate)}, ${formatAmount(item.plannedAmount, 'exact', 1)}, ${item.status}`}
        onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { month: item.dueDate.slice(0, 7), category: item.category } })}>
        <View style={styles.commitmentTop}>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold">{item.name}</AppText>
            <AppText style={[typography.meta, { color: colors.text3 }]}>{item.category} · {formatDate(item.dueDate)}</AppText>
          </View>
          <View style={styles.commitmentStatus}>
            <AmountText value={item.plannedAmount} tier="row" weight="semibold" />
            <StatusBadge label={item.status} tone={item.status === 'overdue' ? 'err' : item.status === 'paid' ? 'ok' : 'neutral'} />
          </View>
        </View>
      </Pressable>
      {pending.length ? (
        <DueActions target={{ kind: item.kind, id: item.id }} pendingCount={pending.length} nextAmount={pending[0]?.plannedAmount ?? item.plannedAmount} />
      ) : null}
    </Card>
  );
}

function BudgetLineCard({
  category, planned, actual, usedPct, status, month,
}: {
  category: string; planned: number; actual: number; usedPct: number | null;
  status: 'ok' | 'near' | 'over'; month: string;
}) {
  const { colors } = useTheme();
  const tone = status === 'over' ? colors.err : status === 'near' ? colors.primary : colors.ok;
  const progressTone = status === 'over' ? 'err' : status === 'near' ? 'primary' : 'ok';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category}: ${formatAmount(actual, 'exact', 1)} of ${formatAmount(planned, 'exact', 1)}`}
      onPress={() => router.push({
        pathname: '/(tabs)/transactions',
        params: { month, category },
      })}
      style={[styles.lineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.lineTop}>
        <AppText weight="semibold">{category}</AppText>
        <AppText
          style={[typography.meta, { color: tone }]}
          accessibilityLabel={`${formatAmount(actual, 'exact', 1)} of ${formatAmount(planned, 'exact', 1)}`}>
          <AmountText value={actual} tier="row" /> / <AmountText value={planned} tier="row" />
        </AppText>
      </View>
      <ProgressBar percent={usedPct ?? 0} tone={progressTone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  content: { paddingBottom: 28, gap: 10 },
  monthHeader: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  quickActions: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickActionsStacked: { flexDirection: 'column', alignItems: 'stretch' },
  quickActionButton: { minWidth: 0, minHeight: 44, flex: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10 },
  quickActionButtonStacked: { flex: 0, width: '100%' },
  quickActionLabel: { flexShrink: 1, textAlign: 'center' },
  quickActionIndicatorSlot: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  quickReviewDot: { width: 6, height: 6, borderRadius: 3 },
  cashFlowTitle: { marginBottom: 10 },
  cashFlowMetrics: { flexDirection: 'row', gap: 14 },
  cashFlowMetricsStacked: { flexDirection: 'column' },
  cashFlowMetric: { flex: 1, minWidth: 0, gap: 4 },
  previousPosition: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previousPositionStacked: { alignItems: 'stretch', flexDirection: 'column' },
  previousPositionText: { flex: 1, minWidth: 0, gap: 3 },
  reviewButton: { flexGrow: 0, minWidth: 82 },
  reviewButtonStacked: { alignSelf: 'stretch' },
  closingPosition: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  closingPositionLabel: { flex: 1, minWidth: 0, gap: 3 },
  closingPositionStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  closingAmount: { fontSize: 18 },
  planSummaryAction: { gap: 12 },
  planSummaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  planMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  planMetricsStacked: { flexDirection: 'column' },
  planMetric: { flexBasis: '45%', flexGrow: 1, minWidth: 0, gap: 4 },
  statRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  commitmentTop: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commitmentStatus: { alignItems: 'flex-end', gap: 4 },
  lineCard: { marginHorizontal: 20, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, gap: 10 },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0008' },
  modal: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 10 },
});
