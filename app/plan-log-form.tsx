import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { monthKey } from '../src/domain/dates';
import { makePlanLogFormSchema, type PlanLogFormInput, type PlanLogFormOutput } from '../src/domain/schemas';
import { currentInstallmentAmount } from '../src/domain/sip';
import type { PlanHolding } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';

export default function PlanLogFormScreen() {
  const params = useLocalSearchParams<{ planId?: string; logId?: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const logId = Array.isArray(params.logId) ? params.logId[0] : params.logId;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const today = useMemo(() => todayISO(), []);
  const plan = data.holdings.find((holding) => holding.id === planId && holding.kind === 'plan') as PlanHolding | undefined;
  const log = plan?.logs.find((entry) => entry.id === logId);
  const linked = log ? data.transactions.some((transaction) => transaction.source?.kind === 'plan-log' && transaction.source.entryId === log.id) : false;
  const schema = useMemo(() => makePlanLogFormSchema(today, { startDate: plan?.startDate ?? today }), [plan?.startDate, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { isDirty, isSubmitting, errors } } = useForm<PlanLogFormInput, undefined, PlanLogFormOutput>({
    resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
    defaultValues: log
      ? { date: log.date, amount: String(log.amount), note: log.note, recordTransaction: linked }
      : { date: today, amount: plan ? String(Math.round(currentInstallmentAmount(plan, today) * 100) / 100) : '', note: '', recordTransaction: true },
  });
  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({
      title: 'Discard changes?', message: 'Your changes have not been saved.',
      confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };
  const persist = (values: PlanLogFormOutput, saveAnyway = false) => {
    if (!plan || submitting.current) return;
    const duplicate = !log && plan.logs.some((entry) => entry.date === values.date && entry.amount === values.amount);
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
      if (log) actions.updatePlanLog(plan.id, log.id, { date: values.date, amount: values.amount, note: values.note });
      else actions.addPlanLog(plan.id, { date: values.date, amount: values.amount, note: values.note }, { recordTransaction: values.recordTransaction });
      const state = useAppStore.getState();
      if (state.lastError) void confirmAsync({ title: 'Could not save log', message: state.lastError, confirmLabel: 'OK' });
      else {
        if ((log && linked) || (!log && values.recordTransaction)) setTxMonth(monthKey(values.date));
        router.back();
      }
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!plan || !log) return;
    void confirmAsync({
      title: 'Delete this entry?',
      message: 'Its linked transaction will also be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.deletePlanLog(plan.id, log.id);
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  if (!plan || (logId && !log)) return <FormScreen title="Plan log" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}><EmptyState title="Plan log not found" /></FormScreen>;
  return (
    <FormScreen title={log ? 'Edit installment log' : 'Log installment'} onClose={close} footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {log ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" style={{flex: 1}} disabled={isSubmitting || Object.keys(errors).length > 0} onPress={() => {
        if (submitting.current) return;
        void handleSubmit((values) => persist(values))();
      }} />
    </View>}>
      <Controller control={control} name="date" render={({ field }) => <DateField value={field.value} onChange={field.onChange} maximumDate={today} error={errors.date?.message} accessibilityLabel="Installment date" />} />
      <Controller control={control} name="amount" render={({ field }) => <MoneyField value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />} />
      <Controller control={control} name="note" render={({ field }) => <TextField label="Note" accessibilityLabel="Installment note" maxLength={60} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.note?.message} />} />
      {log ? <ReadOnlyRow label="Linked transaction" value={linked ? 'Yes' : 'No'} /> : (
        <Controller control={control} name="recordTransaction" render={({ field }) => <SwitchRow label="Also record as a transaction" value={field.value} onValueChange={field.onChange} />} />
      )}
    </FormScreen>
  );
}
