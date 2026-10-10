import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Alert, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Button, EmptyState } from '../src/components/ui';
import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { loanState } from '../src/domain/loan';
import { makeLoanPaymentFormSchema, type LoanPaymentFormInput, type LoanPaymentFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { monthKey } from '../src/domain/dates';
import { useUIStore } from '../src/data/uiStore';

export default function LoanPaymentFormScreen() {
  const params = useLocalSearchParams<{ loanId?: string; paymentId?: string; mode?: string }>();
  const loanId = Array.isArray(params.loanId) ? params.loanId[0] : params.loanId;
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const today = useMemo(() => todayISO(), []);
  const loan = data.loans.find((entry) => entry.id === loanId);
  const payment = loan?.payments.find((entry) => entry.id === paymentId);
  const linked = payment ? data.transactions.some((transaction) => transaction.source?.kind === 'loan-payment' && transaction.source.entryId === payment.id) : false;
  const form = useForm<LoanPaymentFormInput, undefined, LoanPaymentFormOutput>({
    resolver: async (values, context, options) => {
      const outstandingExcludingThis = loan ? loanState({
        ...loan,
        payments: loan.payments.filter((entry) => entry.id !== paymentId),
      }, values.date || today).balance : 0;
      return zodResolver(makeLoanPaymentFormSchema(today, {
        startDate: loan?.startDate ?? today,
        outstandingExcludingThis,
      }))(values, context, options);
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: payment ? {
      date: payment.date, amount: String(payment.amount), kind: payment.kind ?? 'EMI',
      note: payment.note, recordTransaction: linked,
    } : loan ? {
      date: today,
      amount: String(Math.min(loan.emi, Math.ceil(loanState(loan, today).balance))),
      kind: 'EMI', note: '', recordTransaction: true,
    } : { date: today, amount: '', kind: 'EMI', note: '', recordTransaction: true },
  });
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting } } = form;
  const submitting = useRef(false);
  const close = () => {
    if (!isDirty) return router.back();
    Alert.alert('Discard changes?', 'Your changes have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };
  const save = (values: LoanPaymentFormOutput) => {
    if (!loan || submitting.current) return;
    submitting.current = true;
    try {
      if (payment) actions.updateLoanPayment(loan.id, payment.id, { date: values.date, amount: values.amount, kind: values.kind, note: values.note });
      else actions.addLoanPayment(loan.id, { date: values.date, amount: values.amount, kind: values.kind, note: values.note }, { recordTransaction: values.recordTransaction });
      const error = useAppStore.getState().lastError;
      if (error) Alert.alert('Could not save payment', error);
      else {
        if ((payment && linked) || (!payment && values.recordTransaction)) setTxMonth(monthKey(values.date));
        router.back();
      }
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!loan || !payment) return;
    Alert.alert('Delete this entry?', 'Its linked transaction will also be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { actions.deleteLoanPayment(loan.id, payment.id); router.back(); } },
    ]);
  };
  if (!loan || (paymentId && !payment)) return <FormScreen title="Loan payment" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}><EmptyState title="Loan payment not found" /></FormScreen>;
  const initial = payment ?? { date: today, amount: Math.min(loan.emi, Math.ceil(loanState(loan, today).balance)), kind: 'EMI' as const, note: '' };
  return (
    <FormScreen title={payment ? 'Edit payment' : params.mode === 'emi' ? 'Pay EMI' : 'Add payment'} onClose={close} footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {payment ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" disabled={isSubmitting || Object.keys(errors).length > 0} onPress={() => {
        if (submitting.current) return;
        void handleSubmit(save)();
      }} />
    </View>}>
      <Controller control={control} name="date" render={({ field }) => <DateField value={field.value} onChange={(next) => { field.onChange(next); void form.trigger('amount'); }} maximumDate={today} error={errors.date?.message} accessibilityLabel="Payment date" />} />
      <Controller control={control} name="amount" render={({ field }) => <MoneyField value={field.value || String(initial.amount)} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />} />
      <Controller control={control} name="kind" render={({ field }) => <ChoiceField label="Payment type" choices={['EMI', 'Prepayment']} value={field.value} onChange={field.onChange} error={errors.kind?.message} />} />
      <Controller control={control} name="note" render={({ field }) => <TextField label="Note" accessibilityLabel="Payment note" maxLength={60} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.note?.message} />} />
      {payment ? <ReadOnlyRow label="Linked transaction" value={linked ? 'Yes' : 'No'} /> : (
        <Controller control={control} name="recordTransaction" render={({ field }) => <SwitchRow label="Also record as a transaction" value={field.value} onValueChange={field.onChange} />} />
      )}
    </FormScreen>
  );
}
