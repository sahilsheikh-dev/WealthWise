import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button, EmptyState } from '../src/components/ui';
import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { efBalanceOn } from '../src/domain/efActions';
import { makeEfEntryFormSchema, type EfEntryFormInput, type EfEntryFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';

const kindOptions = [
  { label: 'Deposit', value: 'Deposit' },
  { label: 'Withdrawal', value: 'Withdrawal' },
] as const;

export default function EfEntryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const entryId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const entry = entryId ? data.efEntries.find((item) => item.id === entryId) : undefined;
  const linked = entry ? data.transactions.some((transaction) => transaction.source?.kind === 'ef-entry' && transaction.source.entryId === entry.id) : false;
  const schema = useMemo(() => makeEfEntryFormSchema(today, {
    balanceOn: (date) => efBalanceOn(data.efEntries.filter((item) => item.id !== entryId), date),
  }), [data.efEntries, entryId, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, setValue, formState: { errors, isDirty, isSubmitting, submitCount } } =
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
          recordTransaction: linked,
        }
        : { kind: 'Deposit', amount: '', date: today, note: '', recordTransaction: true },
    });
  const kind = useWatch({ control, name: 'kind' });
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
      else actions.addEfEntry(
        { amount, date: values.date, note: values.note },
        { recordTransaction: values.kind === 'Deposit' && values.recordTransaction },
      );
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
    <FormScreen title="Emergency fund entry" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Entry not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title={entry ? 'Edit fund entry' : 'Log emergency fund entry'} onClose={close} footer={(
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {entry ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
        <Button label="Save" variant="primary" disabled={isSubmitting || errorsVisible} onPress={() => {
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
            onChange={(next) => {
              field.onChange(next);
              if (next === 'Withdrawal') setValue('recordTransaction', false, { shouldDirty: true, shouldValidate: true });
            }}
            error={errors.kind?.message}
          />
        )} />
      )}
      <Controller control={control} name="amount" render={({ field }) => (
        <MoneyField label="Amount" accessibilityLabel="Emergency fund amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />
      )} />
      <Controller control={control} name="date" render={({ field }) => (
        <DateField value={field.value} onChange={field.onChange} maximumDate={today} error={errors.date?.message} accessibilityLabel="Emergency fund entry date" />
      )} />
      <Controller control={control} name="note" render={({ field }) => (
        <TextField label="Note" accessibilityLabel="Emergency fund entry note" maxLength={60} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.note?.message} />
      )} />
      {!entry && kind === 'Deposit' ? (
        <Controller control={control} name="recordTransaction" render={({ field }) => (
          <SwitchRow label="Also record as a transaction" value={field.value} onValueChange={field.onChange} />
        )} />
      ) : null}
    </FormScreen>
  );
}
