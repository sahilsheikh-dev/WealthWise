import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { loanState } from '../src/domain/liability';
import { listInstruments } from '../src/domain/instruments';
import {
  makeMoneyMovementFormSchema,
  type MoneyMovementFormInput,
  type MoneyMovementFormOutput,
} from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { formatINR } from '../src/lib/format';
import type { Liability } from '../src/domain/types';

type MovementKind = 'borrowed-in' | 'repay' | 'withdraw' | 'own-funds';

function isMovementKind(value: string | undefined): value is MovementKind {
  return value === 'borrowed-in' || value === 'repay' || value === 'withdraw' || value === 'own-funds';
}

function liabilityLabel(liability: Liability, today: string): string {
  return `${liability.name} · ${formatINR(loanState(liability, today).balance)}`;
}

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function MoneyMovementFormScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const value = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  return isMovementKind(value)
    ? <MoneyMovementForm kind={value} />
    : <FormScreen title="Money movement" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Choose a money movement" />
    </FormScreen>;
}

function MoneyMovementForm({ kind }: { kind: MovementKind }) {
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const instruments = useMemo(() => listInstruments(data, today).filter((item) => item.canWithdraw), [data, today]);
  const liabilities = useMemo(
    () => data.liabilities.filter((item) => loanState(item, today).balance >= 1),
    [data.liabilities, today],
  );
  const schema = useMemo(() => makeMoneyMovementFormSchema(kind, today, {
    liabilityIds: liabilities.map((item) => item.id),
    instrumentIds: instruments.map((item) => item.id),
  }), [instruments, kind, liabilities, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { errors, isSubmitting, submitCount } } =
    useForm<MoneyMovementFormInput, undefined, MoneyMovementFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: {
        amount: '',
        date: today,
        note: '',
        lenderName: '',
        liabilityId: liabilities[0]?.id ?? '',
        instrumentId: instruments[0]?.id ?? '',
      },
    });

  const save = (values: MoneyMovementFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (kind === 'borrowed-in') {
        actions.recordMoneyMovement({
          kind, lenderName: values.lenderName, amount: values.amount, date: values.date, note: values.note,
        });
      } else if (kind === 'repay') {
        actions.recordMoneyMovement({
          kind, liabilityId: values.liabilityId, amount: values.amount, date: values.date, note: values.note,
        });
      } else if (kind === 'withdraw') {
        actions.recordMoneyMovement({
          kind, instrumentId: values.instrumentId, amount: values.amount, date: values.date, note: values.note,
        });
      } else {
        actions.recordMoneyMovement({
          kind, amount: values.amount, date: values.date, note: values.note,
        });
      }
      if (!useAppStore.getState().lastError) router.back();
    } finally {
      submitting.current = false;
    }
  };

  const title = kind === 'borrowed-in' ? 'Money from friend or family'
    : kind === 'repay' ? 'Repay a friend or loan'
      : kind === 'withdraw' ? 'Take money out of savings or investments' : 'Use my own funds';
  const explanation = kind === 'borrowed-in'
    ? 'This records money received and creates a one-time borrowed-money liability.'
    : kind === 'repay'
      ? 'This records a liability payment and its linked expense.'
      : kind === 'withdraw'
        ? 'This records a withdrawal from the selected savings or investment and its linked income.'
        : 'This records money you already had as an Own funds income transaction.';
  const noChoices = kind === 'repay' && liabilities.length === 0
    ? 'There are no outstanding liabilities to repay.'
    : kind === 'withdraw' && instruments.length === 0
      ? 'There are no savings or investments with a withdrawable balance.'
      : null;

  return (
    <FormScreen
      title={title}
      onClose={() => router.back()}
      footer={<Button
        label="Record movement"
        icon="check"
        variant="primary"
        disabled={isSubmitting || (submitCount > 0 && Object.keys(errors).length > 0) || noChoices !== null}
        onPress={() => {
          if (!submitting.current) void handleSubmit(save)();
        }}
      />}>
      <FormErrorBanner message={lastError} />
      <FormErrorBanner message={lastError} />
      <EmptyState title={explanation} />
      {noChoices ? <EmptyState title={noChoices} /> : null}
      {kind === 'borrowed-in' ? (
        <Controller control={control} name="lenderName" render={({ field }) => (
          <TextField
            label="Friend or family member"
            accessibilityLabel="Lender name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.lenderName?.message}
          />
        )} />
      ) : null}
      {kind === 'repay' && liabilities.length > 0 ? (
        <Controller control={control} name="liabilityId" render={({ field }) => (
          <ChoiceField
            label="Liability to repay"
            choices={liabilities.map((item) => item.id)}
            choiceLabels={Object.fromEntries(liabilities.map((item) => [item.id, liabilityLabel(item, today)]))}
            value={field.value}
            onChange={field.onChange}
            error={errors.liabilityId?.message}
          />
        )} />
      ) : null}
      {kind === 'withdraw' && instruments.length > 0 ? (
        <Controller control={control} name="instrumentId" render={({ field }) => (
          <ChoiceField
            label="Withdraw from"
            choices={instruments.map((item) => item.id)}
            choiceLabels={Object.fromEntries(instruments.map((item) => [item.id, `${item.name} · ${formatINR(item.valueNow)}`]))}
            value={field.value}
            onChange={field.onChange}
            error={errors.instrumentId?.message}
          />
        )} />
      ) : null}
      <Controller control={control} name="amount" render={({ field }) => (
        <MoneyField
          label="Amount"
          accessibilityLabel="Movement amount"
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={errors.amount?.message}
        />
      )} />
      <Controller control={control} name="date" render={({ field }) => (
        <DateField label="Date" value={field.value} onChange={field.onChange} maximumDate={today} error={errors.date?.message} />
      )} />
      <Controller control={control} name="note" render={({ field }) => (
        <TextField
          label="Note (optional)"
          accessibilityLabel="Movement note"
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={errors.note?.message}
        />
      )} />
    </FormScreen>
  );
}
