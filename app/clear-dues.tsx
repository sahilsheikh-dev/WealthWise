import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Switch, View } from 'react-native';

import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { AppText, Button, Card, EmptyState, WarningBanner } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { pendingDues, type DueTarget } from '../src/domain/dues';
import { amortizedBalanceAfter } from '../src/domain/liability';
import type { PlanHolding, RecurringLiability } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { formatMonth } from '../src/lib/format';
import { typography } from '../src/theme/tokens';

type Mode = 'settle' | 'record';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function ClearDuesScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const target: DueTarget | null = kind === 'plan' || kind === 'liability' || kind === 'policy'
    ? { kind, id: id ?? '' }
    : null;
  const item: PlanHolding | RecurringLiability | (typeof data.policies)[number] | undefined = !target ? undefined
    : target.kind === 'plan'
      ? data.holdings.find((holding): holding is PlanHolding => holding.id === target.id && holding.kind === 'plan')
      : target.kind === 'liability'
        ? data.liabilities.find((liability): liability is RecurringLiability => liability.id === target.id && liability.kind === 'recurring')
        : data.policies.find((policy) => policy.id === target.id);
  const pending = item ? pendingDues(item, today) : null;
  const initialBalance = item?.kind === 'recurring' ? amortizedBalanceAfter(item, today) : null;
  const firstTransactionMonth = data.transactions
    .map((transaction) => transaction.date.slice(0, 7))
    .sort()[0];
  const defaultMode: Mode = !firstTransactionMonth || (pending?.months[0]?.month ?? '') < firstTransactionMonth
    ? 'settle'
    : 'record';
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [addSkippedToOpening, setAddSkippedToOpening] = useState(true);
  const [balance, setBalance] = useState(initialBalance === null ? '' : String(initialBalance));
  const [busy, setBusy] = useState(false);
  const isDirty = mode !== defaultMode
    || !addSkippedToOpening
    || balance !== (initialBalance === null ? '' : String(initialBalance));

  const save = async () => {
    if (!target || !pending || pending.count === 0 || busy) return;
    if (mode === 'record' && pending.count > 400) {
      await confirmAsync({
        title: 'Too many dues to record',
        message: 'More than 400 payments cannot be recorded in one action. Choose “Already paid” to settle these dues.',
        confirmLabel: 'OK',
      });
      return;
    }
    const recordWarning = mode === 'record'
      ? ' Past months will be updated with linked transactions.'
      : ' No transactions will be added.';
    const confirmed = await confirmAsync({
      title: mode === 'settle' ? 'Mark past dues as already paid?' : 'Record past payments?',
      message: `This will handle ${pending.count} dues totalling ${formatAmount(pending.amount, 'exact', 1)}.${recordWarning}`,
      confirmLabel: 'Confirm',
      cancelLabel: 'Review',
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const summary = actions.clearPastDues(target, {
        mode,
        ...(target.kind === 'plan' ? { addSkippedToOpening } : {}),
        ...(target.kind === 'liability' && balance.trim() ? { balance: Number(balance) } : {}),
      });
      const error = useAppStore.getState().lastError;
      if (error || !summary) {
        if (error) await confirmAsync({ title: 'Could not clear past dues', message: error, confirmLabel: 'OK' });
        return;
      }
      useUIStore.getState().setActionToast({
        message: `Cleared ${summary.count} past dues · ${formatAmount(summary.amount, 'exact', 1)}`,
      });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  if (!target || !item || !pending) {
    return (
      <FormScreen title="Clear past dues" onClose={() => router.back()} isDirty={false} footer={<Button label="Back" onPress={() => router.back()} />}>
        <EmptyState title="Schedule not found" />
      </FormScreen>
    );
  }
  if (pending.count === 0) {
    return (
      <FormScreen title="Clear past dues" onClose={() => router.back()} isDirty={false} footer={<Button label="Done" onPress={() => router.back()} />}>
        <EmptyState title="No past dues" subtitle="There are no unpaid installments up to today." />
      </FormScreen>
    );
  }
  const recordedPayments = item.kind === 'recurring'
    ? item.payments.filter((payment) => payment.date <= today).length
    : 0;

  return (
    <FormScreen
      title="Clear past dues"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={<Button label="Confirm" icon="check" variant="primary" disabled={busy} onPress={() => void save()} />}>
      <Card>
        <AppText weight="semibold">{item.name}</AppText>
        <AppText style={[typography.meta, { marginTop: 6 }]}>
          {pending.count} installments, {formatAmount(pending.amount, 'exact', 1)} total
        </AppText>
        <AppText style={[typography.meta, { marginTop: 8 }]}>Affected months</AppText>
        {pending.months.map((month) => (
          <AppText key={month.month} style={typography.meta}>
            {formatMonth(month.month)} · {formatAmount(month.amount, 'exact', 1)}
          </AppText>
        ))}
      </Card>
      <AppText weight="semibold">How should these past installments be handled?</AppText>
      <SegmentedControl
        value={mode}
        options={[
          { label: 'Already paid', value: 'settle' },
          { label: 'Record as paid', value: 'record' },
        ]}
        onChange={setMode}
      />
      {mode === 'settle' && target.kind === 'plan' ? (
        <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <AppText style={[typography.meta, { flex: 1 }]}>Add them to what I have already invested</AppText>
          <Switch
            accessibilityRole="switch"
            accessibilityLabel="Add missed plan installments to opening investment"
            value={addSkippedToOpening}
            onValueChange={setAddSkippedToOpening}
          />
        </View>
      ) : null}
      {mode === 'settle' && target.kind === 'liability' && item.kind === 'recurring' ? (
        <>
          <MoneyField
            label="Outstanding balance today"
            accessibilityLabel="Outstanding balance today"
            value={balance}
            onChangeText={setBalance}
          />
          <AppText style={typography.meta}>Suggested balance: {formatAmount(initialBalance ?? 0, 'exact', 1)}</AppText>
          {recordedPayments > 0 ? (
            <WarningBanner>
              {recordedPayments} recorded payments are treated as already included in this balance.
            </WarningBanner>
          ) : null}
        </>
      ) : null}
      {mode === 'record' ? (
        <WarningBanner>
          Each installment will be recorded on its due date. Past months will change.
        </WarningBanner>
      ) : null}
    </FormScreen>
  );
}
