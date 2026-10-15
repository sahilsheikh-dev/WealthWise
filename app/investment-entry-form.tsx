import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { monthKey } from '../src/domain/dates';
import { holdingValue } from '../src/domain/portfolio';
import { makeInvestmentEntryFormSchema, type InvestmentEntryFormInput, type InvestmentEntryFormOutput } from '../src/domain/schemas';
import { currentInstallmentAmount } from '../src/domain/sip';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function InvestmentEntryFormScreen() {
  const params = useLocalSearchParams<{ holdingId?: string; entryId?: string; kind?: 'Deposit' | 'Withdrawal'; date?: string; amount?: string }>();
  const holdingId = Array.isArray(params.holdingId) ? params.holdingId[0] : params.holdingId;
  const entryId = Array.isArray(params.entryId) ? params.entryId[0] : params.entryId;
  const requestedKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const requestedAmount = Array.isArray(params.amount) ? params.amount[0] : params.amount;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const today = useMemo(() => todayISO(), []);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const entry = holding?.logs.find((item) => item.id === entryId);
  const linked = entry ? data.transactions.some((transaction) => transaction.source?.kind === 'holding-entry' && transaction.source.entryId === entry.id) : false;
  const currentValue = holding
    ? holdingValue(
      entry?.kind === 'Withdrawal'
        ? { ...holding, logs: holding.logs.filter((item) => item.id !== entry.id) }
        : holding,
      today,
    )
    : 0;
  const schema = useMemo(() => makeInvestmentEntryFormSchema(today, {
    startDate: holding?.kind === 'plan' ? holding.startDate : null,
    currentValue,
  }), [currentValue, holding, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { isDirty, isSubmitting, errors } } = useForm<InvestmentEntryFormInput, undefined, InvestmentEntryFormOutput>({
    resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
    defaultValues: entry
      ? { kind: entry.kind, date: entry.date, amount: String(entry.amount), note: entry.note }
      : {
        kind: requestedKind ?? 'Deposit',
        date: requestedDate ?? today,
        amount: requestedAmount
          ?? (holding?.kind === 'plan' && requestedKind !== 'Withdrawal'
            ? String(Math.round(currentInstallmentAmount(holding, today) * 100) / 100)
            : ''),
        note: '',
      },
  });
  const persist = (values: InvestmentEntryFormOutput, saveAnyway = false) => {
    if (!holding || submitting.current) return;
    const duplicate = !entry && values.kind === 'Deposit' && holding.logs.some((row) => row.kind === 'Deposit' && row.date === values.date && row.amount === values.amount);
    if (duplicate && !saveAnyway) {
      void choiceAsync({
        title: 'Possible duplicate',
        message: 'A log with the same date and amount already exists.',
        choices: [{ id: 'save', label: 'Save anyway' }],
      }).then((choice) => { if (choice === 'save') persist(values, true); });
      return;
    }
    submitting.current = true;
    try {
      if (entry) actions.updateInvestmentEntry(holding.id, entry.id, { date: values.date, amount: values.amount, note: values.note });
      else actions.addInvestmentEntry(holding.id, values);
      const state = useAppStore.getState();
      if (state.lastError) void confirmAsync({ title: 'Could not save log', message: state.lastError, confirmLabel: 'OK' });
      else {
        if ((entry && linked) || !entry) setTxMonth(monthKey(values.date));
        router.back();
      }
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!holding || !entry) return;
    void confirmAsync({
      title: 'Delete this entry?',
      message: 'Its linked transaction will also be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.deleteInvestmentEntry(holding.id, entry.id);
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  if (!holding || (entryId && !entry)) return <FormScreen title="Investment entry" onClose={() => router.back()} isDirty={false} footer={<Button label="Back" onPress={() => router.back()} />}><EmptyState title="Investment entry not found" /></FormScreen>;
  return (
    <FormScreen title="Investment entry" onClose={() => router.back()} isDirty={isDirty}
      headerAction={entry ? { label: 'Delete investment entry', onPress: remove } : undefined}
      footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Button label="Save" icon="save" variant="primary" style={{flex: 1}} disabled={isSubmitting || Object.keys(errors).length > 0} onPress={() => {
        if (submitting.current) return;
        void handleSubmit((values) => persist(values))();
      }} />
    </View>}>
      {entry ? <ReadOnlyRow label="Entry type" value={entry.kind} /> : (
        <Controller control={control} name="kind" render={({ field }) => (
          <SegmentedControl
            value={field.value}
            options={[{ label: 'Deposit', value: 'Deposit' }, { label: 'Withdrawal', value: 'Withdrawal' }]}
            onChange={field.onChange}
          />
        )} />
      )}
      <Controller control={control} name="date" render={({ field }) => <DateField value={field.value} onChange={field.onChange} maximumDate={today} error={errors.date?.message} accessibilityLabel="Installment date" />} />
      <Controller control={control} name="amount" render={({ field }) => <MoneyField value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />} />
      <Controller control={control} name="note" render={({ field }) => <TextField label="Note" accessibilityLabel="Installment note" maxLength={60} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.note?.message} />} />
      {entry ? <ReadOnlyRow label="Linked transaction" value={linked ? 'Yes' : 'No'} /> : null}
    </FormScreen>
  );
}
