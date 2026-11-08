import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { CardHeaderRow } from '../src/components/CardHeaderRow';
import { DueActions } from '../src/components/DueActions';
import { SortChip } from '../src/components/SortChip';
import { AppText, Button, Card, Chip, ChipRow, EmptyState, ProgressBar, Screen, SectionTitle, StatusBadge } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { budgetMonthView } from '../src/domain/budget';
import { shiftMonth } from '../src/domain/dates';
import { efBalance } from '../src/domain/ef';
import type { BudgetCommitment } from '../src/domain/budget';
import { confirmAsync } from '../src/lib/confirm';
import { formatDate, formatINR, formatMonth } from '../src/lib/format';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { swipeIntent } from '../src/lib/swipe';
import { todayISO } from '../src/lib/clock';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

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
  const sorting = useSort('budgetSpending');
  const today = todayISO();
  const view = useMemo(() => budgetMonthView(data, month), [data, month]);
  const templates = data.budgetTemplates ?? [];
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
          <AppHeader title="Budget" rightActions={[
            { icon: 'list', label: 'Budget templates', onPress: () => router.push('/budget-templates') },
            { icon: 'clock', label: 'Budget history', onPress: () => router.push('/budget-history') },
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

          <Card>
            <SectionTitle>Cash flow</SectionTitle>
            <BudgetStat label="Opening balance" value={formatINR(view.position.opening)} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/month-review', params: { month: shiftMonth(month, -1) } })}>
              <BudgetStat
                label={`Previous month ${view.position.previousClosing < 0 ? 'deficit' : 'surplus'}`}
                value={formatINR(Math.abs(view.position.previousClosing))}
              />
            </Pressable>
            <BudgetStat label="This month’s flow" value={formatINR(view.position.flow)} />
            <BudgetStat label="Closing balance" value={formatINR(view.position.closing)} bold />
          </Card>

          {!view.budget ? (
            <Card>
              <EmptyState title="No budget for this month" subtitle="Apply a template to create this month’s spending plan." />
              <Button label="Apply template" icon="check" variant="primary" onPress={() => setApplyOpen(true)} />
            </Card>
          ) : (
            <Card>
              <CardHeaderRow
                title={<AppText weight="semibold">Plan summary</AppText>}
                subtitle={view.budget.customized ? <Chip label="Customized" selected /> : null}
                value={<AppText weight="bold">{view.plannedIncome === null ? '—' : formatINR(view.plannedIncome)}</AppText>}
                valueCaption={<AppText style={typography.meta}>planned income</AppText>}
                editLabel="Customize this month’s budget"
                onEdit={() => router.push({ pathname: '/budget-month-form', params: { month } })}
              />
              <BudgetStat label="Planned spending" value={formatINR(view.plannedSpend)} />
              <BudgetStat label="Planned savings" value={formatINR(view.plannedSave)} />
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
              <SectionTitle>Spending plan</SectionTitle>
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
                  <BudgetStat label="Emergency fund balance" value={formatINR(efBalance(data.efEntries))} />
                  <AppText style={typography.meta}>Manage your Emergency fund</AppText>
                </Card>
              </Pressable>
              <SectionTitle>Debt repayments</SectionTitle>
              <Card>
                <BudgetStat label="EMIs planned" value={formatINR(view.debt.emiPlanned)} />
                <BudgetStat label="EMIs paid" value={formatINR(view.debt.emiActual)} />
                <BudgetStat label="Prepayments" value={formatINR(view.debt.prepaymentsActual)} />
              </Card>
              <SectionTitle>Insurance</SectionTitle>
              <Card>
                <BudgetStat label="Premiums planned" value={formatINR(view.commitments.filter((row) => row.kind === 'policy').reduce((sum, row) => sum + row.plannedAmount, 0))} />
                <BudgetStat label="Premiums paid" value={formatINR(view.commitments.filter((row) => row.kind === 'policy').reduce((sum, row) => sum + row.paidAmount, 0))} />
              </Card>
              <SectionTitle>Unbudgeted spending</SectionTitle>
              <Card><BudgetStat label="Unbudgeted" value={formatINR(view.unbudgeted)} /></Card>
              <SectionTitle>Outstanding at month end</SectionTitle>
              <Card><BudgetStat label={`${view.outstanding.count} overdue dues`} value={formatINR(view.outstanding.amount)} /></Card>
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

function BudgetStat({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.statRow}>
      <AppText>{label}</AppText>
      <AppText weight={bold ? 'bold' : 'medium'}>{value}</AppText>
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
        onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { month: item.dueDate.slice(0, 7), category: item.category } })}>
        <View style={styles.commitmentTop}>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold">{item.name}</AppText>
            <AppText style={[typography.meta, { color: colors.text3 }]}>{item.category} · {formatDate(item.dueDate)}</AppText>
          </View>
          <View style={styles.commitmentStatus}>
            <AppText weight="semibold">{formatINR(item.plannedAmount)}</AppText>
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
      accessibilityLabel={`${category}: ${formatINR(actual)} of ${formatINR(planned)}`}
      onPress={() => router.push({
        pathname: '/(tabs)/transactions',
        params: { month, category },
      })}
      style={[styles.lineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.lineTop}>
        <AppText weight="semibold">{category}</AppText>
        <AppText style={[typography.meta, { color: tone }]}>{formatINR(actual)} / {formatINR(planned)}</AppText>
      </View>
      <ProgressBar percent={usedPct ?? 0} tone={progressTone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gestureSurface: { flex: 1 },
  content: { paddingBottom: 28, gap: 10 },
  monthHeader: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  statRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  commitmentTop: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commitmentStatus: { alignItems: 'flex-end', gap: 4 },
  lineCard: { marginHorizontal: 20, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, gap: 10 },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0008' },
  modal: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 10 },
});
