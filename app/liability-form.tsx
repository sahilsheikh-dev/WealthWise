import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { HelperText } from '../src/components/form/HelperText';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { emiAuto } from '../src/domain/liability';
import { makeLiabilityFormSchema, type LiabilityFormInput, type LiabilityFormOutput } from '../src/domain/schemas';
import { LIABILITY_TYPES } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';
import { formatINR } from '../src/lib/format';

const kindOptions = [
  { label: 'Recurring (EMI)', value: 'recurring' },
  { label: 'One-time', value: 'one-time' },
] as const;

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((item) => item.id === liabilityId);
  const schema = useMemo(() => makeLiabilityFormSchema(today, {
    otherNames: [
      ...data.liabilities.filter((item) => item.id !== liabilityId).map((item) => item.name),
      ...data.holdings.map((holding) => holding.name),
    ],
    earliestPaymentDate: liability?.payments.map((payment) => payment.date).sort()[0] ?? null,
  }), [data.holdings, data.liabilities, liability?.payments, liabilityId, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, setValue, formState: { isDirty, isSubmitting, errors, submitCount } } =
    useForm<LiabilityFormInput, undefined, LiabilityFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: liability
        ? liability.kind === 'recurring'
          ? {
            kind: 'recurring',
            name: liability.name,
            type: liability.type,
            principal: String(liability.principal),
            ratePct: String(liability.ratePct),
            tenureMonths: String(liability.tenureMonths),
            startDate: liability.startDate,
            emi: String(liability.emi),
            dueDate: '',
          }
          : {
            kind: 'one-time',
            name: liability.name,
            type: liability.type,
            principal: String(liability.principal),
            ratePct: String(liability.ratePct),
            startDate: liability.startDate,
            dueDate: liability.dueDate ?? '',
            tenureMonths: '',
            emi: '',
          }
        : {
          kind: 'recurring',
          name: '',
          type: 'Other',
          principal: '',
          ratePct: '',
          tenureMonths: '',
          startDate: today,
          emi: '',
          dueDate: '',
        },
    });
  const kind = useWatch({ control, name: 'kind' });
  const principal = useWatch({ control, name: 'principal' });
  const rate = useWatch({ control, name: 'ratePct' });
  const tenure = useWatch({ control, name: 'tenureMonths' });
  const emi = useWatch({ control, name: 'emi' });
  const principalValue = Number(principal);
  const rateValue = Number(rate);
  const tenureValue = Number(tenure);
  const calculated = kind === 'recurring' && principalValue > 0 && rateValue >= 0 && tenureValue > 0
    && [principalValue, rateValue, tenureValue].every(Number.isFinite)
    ? emiAuto(principalValue, rateValue, tenureValue)
    : null;
  const underTenure = calculated !== null && Number(emi) > 0 && Number(emi) * tenureValue < principalValue;

  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({
      title: 'Discard changes?',
      message: 'Your changes have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };
  const save = (values: LiabilityFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (liabilityId) {
        const { kind: _kind, ...patch } = values;
        actions.updateLiability(liabilityId, patch);
      }
      else actions.addLiability(values);
      const error = useAppStore.getState().lastError;
      if (error) void confirmAsync({ title: 'Could not save liability', message: error, confirmLabel: 'OK' });
      else router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!liability) return;
    const linkedCount = useAppStore.getState().data.transactions.filter((transaction) =>
      transaction.source?.kind === 'liability-payment' && transaction.source.parentId === liability.id,
    ).length;
    void choiceAsync({
      title: 'Delete liability?',
      message: `This removes ${liability.payments.length} payments and affects ${linkedCount} linked transactions.`,
      choices: [
        { id: 'keep', label: 'Keep transactions' },
        { id: 'delete', label: 'Delete everything', destructive: true },
      ],
    }).then((choice) => {
      if (!choice) return;
      actions.deleteLiability(liability.id, { linkedTransactions: choice === 'keep' ? 'keep' : 'delete' });
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  if (liabilityId && !liability) return (
    <FormScreen title="Liability" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Liability not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title={liability ? 'Edit liability' : 'New liability'} onClose={close} footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {liability ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || errorsVisible} onPress={() => {
        if (!submitting.current) void handleSubmit(save)();
      }} />
    </View>}>
      {liability ? <ReadOnlyRow label="Liability kind" value={liability.kind === 'recurring' ? 'Recurring (EMI)' : 'One-time'} /> : (
        <Controller control={control} name="kind" render={({ field }) => (
          <SegmentedControl
            label="Liability kind"
            options={kindOptions}
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              if (next === 'one-time') setValue('ratePct', rate || '0', { shouldDirty: true });
            }}
            error={errors.kind?.message}
          />
        )} />
      )}
      <Controller control={control} name="name" render={({ field }) => (
        <TextField label="Name" accessibilityLabel="Liability name" maxLength={40} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />
      )} />
      <Controller control={control} name="type" render={({ field }) => (
        <ChoiceField label="Type" choices={[...LIABILITY_TYPES]} value={field.value} onChange={field.onChange} error={errors.type?.message} />
      )} />
      <Controller control={control} name="principal" render={({ field }) => (
        <MoneyField label={kind === 'one-time' ? 'Amount borrowed' : 'Principal'} accessibilityLabel={kind === 'one-time' ? 'Amount borrowed' : 'Liability principal'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.principal?.message} />
      )} />
      <Controller control={control} name="ratePct" render={({ field }) => (
        <PercentField label="Annual interest rate" accessibilityLabel="Annual interest rate" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.ratePct?.message} />
      )} />
      <Controller control={control} name="startDate" render={({ field }) => (
        <DateField label="Start date" value={field.value} onChange={field.onChange} maximumDate={today} error={errors.startDate?.message} accessibilityLabel="Liability start date" />
      )} />
      {kind === 'recurring' ? (
        <>
          <Controller control={control} name="tenureMonths" render={({ field }) => (
            <IntegerField label="Tenure (months)" accessibilityLabel="Liability tenure in months" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.tenureMonths?.message} />
          )} />
          <Controller control={control} name="emi" render={({ field }) => (
            <MoneyField label="EMI (optional)" accessibilityLabel="Liability EMI" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.emi?.message} />
          )} />
          {calculated !== null ? <View style={{ gap: 6 }}>
            <HelperText>Calculated EMI: {formatINR(calculated)}</HelperText>
            <Button label="Use this" onPress={() => setValue('emi', String(calculated), { shouldDirty: true, shouldValidate: true })} />
          </View> : null}
          {underTenure ? <HelperText tone="warning">This EMI won&apos;t repay the liability within the tenure</HelperText> : null}
        </>
      ) : (
        <Controller control={control} name="dueDate" render={({ field }) => (
          <TextField
            label="Due date (optional, YYYY-MM-DD)"
            accessibilityLabel="Liability due date"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.dueDate?.message}
          />
        )} />
      )}
    </FormScreen>
  );
}
