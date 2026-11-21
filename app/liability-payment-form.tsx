import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Dropdown } from '../src/components/Dropdown';
import { DateField } from '../src/components/form/DateField';
import { FieldTitle } from '../src/components/form/FieldTitle';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { monthKey } from '../src/domain/dates';
import { isLiabilityClosed, loanState } from '../src/domain/liability';
import { makeLiabilityPaymentFormSchema, type LiabilityPaymentFormInput, type LiabilityPaymentFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityPaymentFormScreen() {
  const params = useLocalSearchParams<{ liabilityId?: string; paymentId?: string; mode?: string; kind?: 'EMI' | 'Payment'; amount?: string; date?: string }>();
  const liabilityId = Array.isArray(params.liabilityId) ? params.liabilityId[0] : params.liabilityId;
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  const requestedKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const requestedAmount = Array.isArray(params.amount) ? params.amount[0] : params.amount;
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const today = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((entry) => entry.id === liabilityId);
  const payment = liability?.payments.find((entry) => entry.id === paymentId);
  const linked = payment
    ? data.transactions.some((transaction) => transaction.source?.kind === 'liability-payment' && transaction.source.entryId === payment.id)
    : false;
  const form = useForm<LiabilityPaymentFormInput, undefined, LiabilityPaymentFormOutput>({
    resolver: async (values, context, options) => {
      const outstandingExcludingThis = liability ? loanState({
        ...liability,
        payments: liability.payments.filter((entry) => entry.id !== paymentId),
      }, values.date || today).balance : 0;
      return zodResolver(makeLiabilityPaymentFormSchema(today, {
        startDate: liability?.startDate ?? today,
        outstandingExcludingThis,
        oneTime: liability?.kind === 'one-time',
      }))(values, context, options);
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: payment
      ? {
        date: payment.date,
        amount: String(payment.amount),
        kind: payment.kind,
        note: payment.note,
      }
      : liability
        ? {
          date: requestedDate ?? today,
          amount: requestedAmount ?? String(Math.min(
            liability.kind === 'recurring' ? liability.emi : loanState(liability, today).balance,
            Math.ceil(loanState(liability, today).balance),
          )),
          kind: requestedKind ?? (liability.kind === 'recurring' ? 'EMI' : 'Payment'),
          note: '',
        }
        : { date: today, amount: '', kind: 'EMI', note: '' },
  });
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting } } = form;
  const submitting = useRef(false);
  const save = (values: LiabilityPaymentFormOutput) => {
    if (!liability || submitting.current) return;
    submitting.current = true;
    try {
      if (payment) {
        actions.updateLiabilityPayment(liability.id, payment.id, {
          date: values.date,
          amount: values.amount,
          kind: values.kind,
          note: values.note,
        });
      } else {
        actions.addLiabilityPayment(liability.id, {
          date: values.date,
          amount: values.amount,
          kind: values.kind,
          note: values.note,
        });
      }
      const error = useAppStore.getState().lastError;
      if (error) void confirmAsync({ title: 'Could not save payment', message: error, confirmLabel: 'OK' });
      else {
        if ((payment && linked) || !payment) setTxMonth(monthKey(values.date));
        router.back();
      }
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!liability || !payment) return;
    void confirmAsync({
      title: 'Delete this entry?',
      message: 'Its linked transaction will also be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.deleteLiabilityPayment(liability.id, payment.id);
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  if (!liability || (paymentId && !payment)) return (
    <FormScreen title="Liability payment" onClose={() => router.back()} isDirty={false} footer={null}>
      <EmptyState title="Liability payment not found" />
    </FormScreen>
  );
  if (isLiabilityClosed(liability)) return (
    <FormScreen title="Liability payment" onClose={() => router.back()} isDirty={false} footer={null}>
      <EmptyState title="Payments are read-only for a closed loan" />
    </FormScreen>
  );
  const initialBalance = loanState(liability, today).balance;
  const initial = payment ?? {
    date: today,
    amount: Math.min(liability.kind === 'recurring' ? liability.emi : initialBalance, Math.ceil(initialBalance)),
    kind: liability.kind === 'recurring' ? 'EMI' as const : 'Payment' as const,
    note: '',
  };
  return (
    <FormScreen title="Liability payment" onClose={() => router.back()} isDirty={isDirty}
      headerAction={payment ? { label: 'Delete payment', onPress: remove } : undefined}
      footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Button label="Save" icon="save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || Object.keys(errors).length > 0} onPress={() => {
        if (!submitting.current) void handleSubmit(save)();
      }} />
    </View>}>
      <Controller control={control} name="date" render={({ field }) => (
        <DateField label="Payment date" value={field.value} onChange={(next) => { field.onChange(next); void form.trigger('amount'); }} maximumDate={today} error={errors.date?.message} accessibilityLabel="Payment date" />
      )} />
      <Controller control={control} name="amount" render={({ field }) => (
        <FieldTitle title="Amount">
          <MoneyField value={field.value || String(initial.amount)} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />
        </FieldTitle>
      )} />
      {liability.kind === 'recurring'
        ? <Controller control={control} name="kind" render={({ field }) => (
          <Dropdown label="Payment type" accessibilityLabel="Payment type" options={['EMI', 'Prepayment'].map((type) => ({ value: type, title: type }))} value={field.value} onChange={field.onChange} error={errors.kind?.message} />
        )} />
        : <ReadOnlyRow label="Payment type" value="Payment" />}
      <Controller control={control} name="note" render={({ field }) => (
        <FieldTitle title="Note">
          <TextField label="Note" accessibilityLabel="Payment note" maxLength={60} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.note?.message} />
        </FieldTitle>
      )} />
      {payment ? <ReadOnlyRow label="Linked transaction" value={linked ? 'Yes' : 'No'} /> : null}
    </FormScreen>
  );
}
