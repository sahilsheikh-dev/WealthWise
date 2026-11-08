import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { efEndOfDayBalances } from '../src/domain/efActions';
import { makeEfEntryFormSchema, type EfEntryFormInput, type EfEntryFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const kindOptions = [
  { label: 'Deposit', value: 'Deposit' },
  { label: 'Withdrawal', value: 'Withdrawal' },
] as const;

export default function EfEntryFormScreen() {
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: 'Deposit' | 'Withdrawal' }>();
  const entryId = Array.isArray(id) ? id[0] : id;
  const requestedKind = Array.isArray(kind) ? kind[0] : kind;
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const entry = entryId ? data.efEntries.find((item) => item.id === entryId) : undefined;
  const linked = entry ? data.transactions.some((transaction) => transaction.source?.kind === 'ef-entry' && transaction.source.entryId === entry.id) : false;
  const schema = useMemo(() => makeEfEntryFormSchema(today, {
    firstNegativeDate: (candidate) => {
      const entries = entryId ? data.efEntries.filter((item) => item.id !== entryId) : data.efEntries;
      const balances = efEndOfDayBalances([...entries, { ...candidate, id: 'candidate', note: '' }]);
      return balances.find(({ balance }) => balance < 0)?.date ?? null;
    },
  }), [data.efEntries, entryId, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<EfEntryFormInput, undefined, EfEntryFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: entry
        ? {
          kind: entry.amount > 0 ? 'Deposit' : 'Withdrawal',
          amount: String(Math.abs(entry.amount)),
          date: entry.date,
          note: entry.note,
        }
        : { kind: requestedKind ?? 'Deposit', amount: '', date: today, note: '' },
    });
  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({
      title: 'Discard changes?', message: 'Your changes have not been saved.',
      confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };
  const save = (values: EfEntryFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const amount = values.kind === 'Deposit' ? values.amount : -values.amount;
      if (entry) actions.updateEfEntry(entry.id, { amount, date: values.date, note: values.note });
      else actions.addEfEntry({ amount, date: values.date, note: values.note });
      if (!useAppStore.getState().lastError) router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!entry) return;
    void confirmAsync({
      title: 'Delete this entry?',
      message: 'Its linked transaction will also be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.deleteEfEntry(entry.id);
      if (!useAppStore.getState().lastError) router.back();
    });
  };

  if (entryId && !entry) return (
    <FormScreen title="Emergency fund Entry" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Entry not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title={entry ? 'Edit fund entry' : 'Log Emergency fund Entry'} onClose={close} footer={(
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {entry ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
        <Button label="Save" variant="primary" style={{flex: 1}} disabled={isSubmitting || errorsVisible} onPress={() => {
          if (!submitting.current) void handleSubmit(save)();
        }} />
      </View>
    )}>
      <FormErrorBanner message={lastError} />
      {entry && linked ? <ReadOnlyRow label="Linked transaction" value="Linked transaction: yes" /> : null}
      {entry && linked ? (
        <ReadOnlyRow label="Entry type" value={entry.amount > 0 ? 'Deposit' : 'Withdrawal'} />
      ) : (
        <Controller control={control} name="kind" render={({ field }) => (
          <SegmentedControl
            label="Entry type"
            value={field.value}
            options={kindOptions}
            onChange={field.onChange}
            error={errors.kind?.message}
          />
        )} />
      )}
      <Controller control={control} name="amount" render={({ field }) => (
        <MoneyField label="Amount" accessibilityLabel="Emergency fund Amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />
      )} />
      <Controller control={control} name="date" render={({ field }) => (
        <DateField value={field.value} onChange={field.onChange} maximumDate={today} error={errors.date?.message} accessibilityLabel="Emergency fund Entry Date" />
      )} />
      <Controller control={control} name="note" render={({ field }) => (
        <TextField label="Note" accessibilityLabel="Emergency fund Entry Note" maxLength={60} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.note?.message} />
      )} />
    </FormScreen>
  );
}
