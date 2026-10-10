import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button, EmptyState } from '../src/components/ui';
import { ChoiceField } from '../src/components/form/ChoiceField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { HelperText } from '../src/components/form/HelperText';
import { MoneyField } from '../src/components/form/MoneyField';
import { TextField } from '../src/components/form/TextField';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { todayISO } from '../src/lib/clock';
import { makeHoldingFormSchema, type HoldingFormInput, type HoldingFormOutput } from '../src/domain/schemas';
import type { HoldingType, ManualHolding } from '../src/domain/types';
import { confirmAsync } from '../src/lib/confirm';

const holdingTypes: HoldingType[] = [
  'Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit', 'Recurring deposit', 'EPFO / PF',
  'Savings account', 'Cash', 'Gold', 'Silver', 'Other',
];

export default function HoldingFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const today = todayISO();
  const actions = useAppActions();
  const holding = holdingId
    ? data.holdings.find((item) => item.id === holdingId && item.kind === 'manual') as ManualHolding | undefined
    : undefined;
  const schema = useMemo(() => makeHoldingFormSchema({
    otherNames: data.holdings.filter((item) => item.id !== holdingId).map((item) => item.name),
  }), [data.holdings, holdingId]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<HoldingFormInput, undefined, HoldingFormOutput>({
      resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
      defaultValues: holding
        ? { name: holding.name, type: holding.type, invested: String(holding.invested), value: String(holding.value) }
        : { name: '', type: 'EPFO / PF', invested: '', value: '' },
    });
  const invested = useWatch({ control, name: 'invested' });
  const value = useWatch({ control, name: 'value' });
  const numericAmount = (raw: string) => Number(raw.replaceAll(',', ''));
  const belowCost = Number.isFinite(numericAmount(invested)) && Number.isFinite(numericAmount(value))
    && numericAmount(value) < numericAmount(invested);
  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({
      title: 'Discard changes?', message: 'Your changes have not been saved.',
      confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };
  const save = (values: HoldingFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const input = { ...values };
      if (holding) actions.updateHolding(holding.id, input);
      else actions.addHolding(input);
      if (!useAppStore.getState().lastError) router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!holding) return;
    void confirmAsync({
      title: 'Delete holding?', message: `Delete ${holding.name}? This cannot be undone.`,
      confirmLabel: 'Delete', destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.deleteHolding(holding.id);
      if (!useAppStore.getState().lastError) router.back();
    });
  };

  if (holdingId && !holding) return (
    <FormScreen title="Holding" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Manual holding not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title={holding ? 'Edit holding' : 'Add holding'} onClose={close} footer={(
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {holding ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
        <Button label="Save" variant="primary" disabled={isSubmitting || errorsVisible} onPress={() => {
          if (!submitting.current) void handleSubmit(save)();
        }} />
      </View>
    )}>
      <FormErrorBanner message={lastError} />
      <Controller control={control} name="name" render={({ field }) => (
        <TextField label="Name" accessibilityLabel="Holding name" maxLength={40} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />
      )} />
      <Controller control={control} name="type" render={({ field }) => (
        <ChoiceField label="Type" choices={holdingTypes} value={field.value} onChange={field.onChange} error={errors.type?.message} />
      )} />
      <Controller control={control} name="invested" render={({ field }) => (
        <MoneyField label="Invested" accessibilityLabel="Holding invested amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.invested?.message} />
      )} />
      <Controller control={control} name="value" render={({ field }) => (
        <MoneyField label="Current value" accessibilityLabel="Holding current value" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.value?.message} />
      )} />
      {holding ? (
        <Button
          label="Value is still correct today"
          variant="soft"
          disabled={holding.valueAsOf === today}
          onPress={() => actions.confirmHoldingValue(holding.id)}
        />
      ) : null}
      {belowCost ? <HelperText tone="warning">Value is below what you invested</HelperText> : null}
    </FormScreen>
  );
}
