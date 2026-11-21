import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { View } from 'react-native';

import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { HelperText } from '../src/components/form/HelperText';
import { MoneyField } from '../src/components/form/MoneyField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FieldTitle } from '../src/components/form/FieldTitle';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { holdingValue } from '../src/domain/portfolio';
import { suggestedValuationMethod } from '../src/domain/valuation';
import { makeHoldingValuationFormSchema } from '../src/domain/schemas';
import type { ValuationMethod } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function HoldingValuationFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const error = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const valueFormSchema = useMemo(() => makeHoldingValuationFormSchema(today), [today]);
  const method: ValuationMethod | undefined = holding
    ? holding.valuationMethod ?? suggestedValuationMethod(
      holding.type,
      holding.logs.some((entry) => entry.price !== undefined),
      holding.ratePct,
    )
    : undefined;
  const submitting = useRef(false);
  const form = useForm<z.input<typeof valueFormSchema>, undefined, z.output<typeof valueFormSchema>>({
    resolver: zodResolver(valueFormSchema),
    mode: 'onTouched',
    defaultValues: {
      value: holding && method !== 'unitsPrice' ? String(holdingValue(holding, today)) : '',
      date: today,
    },
  });

  if (!holding || !method) {
    return <FormScreen title="Update holding value" onClose={() => router.back()} isDirty={false} footer={null}>
      <EmptyState title="Holding not found" />
    </FormScreen>;
  }

  const save = (values: z.output<typeof valueFormSchema>) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (method === 'unitsPrice') actions.updateHoldingPrice(holding.id, values.value, values.date);
      else actions.updateHoldingValue(holding.id, values.value, values.date, method);
      if (!useAppStore.getState().lastError) router.back();
    } finally {
      submitting.current = false;
    }
  };

  return (
    <FormScreen title={method === 'unitsPrice' ? 'Update price' : 'Update value'}
      onClose={() => router.back()} isDirty={form.formState.isDirty}
      footer={<View style={{ flexDirection: 'row' }}>
        <Button
          label="Save"
          icon="save"
          variant="primary"
          style={{ flex: 1 }}
          disabled={form.formState.isSubmitting || Object.keys(form.formState.errors).length > 0}
          onPress={() => void form.handleSubmit(save)()}
        />
      </View>}>
      <FormErrorBanner message={error} />
      <Controller control={form.control} name="value" render={({ field }) => (
        <FieldTitle title={method === 'unitsPrice' ? 'Latest price per unit' : 'Confirmed value'}>
          <MoneyField
            label={method === 'unitsPrice' ? 'Latest price per unit' : 'Confirmed value'}
            accessibilityLabel={method === 'unitsPrice' ? 'Latest price per unit' : 'Confirmed holding value'}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={form.formState.errors.value?.message}
          />
        </FieldTitle>
      )} />
      <Controller control={form.control} name="date" render={({ field }) => <DateField
        label={method === 'unitsPrice' ? 'Price date' : 'Value date'}
        accessibilityLabel={method === 'unitsPrice' ? 'Price date' : 'Value date'}
        value={field.value}
        onChange={field.onChange}
        maximumDate={today}
        error={form.formState.errors.date?.message}
      />} />
      {method === 'accrual' ? (
        <HelperText>Future values are estimates using {holding.ratePct ?? 0}% p.a., {holding.compounding ?? 'yearly'} compounding, and actual days / 365. A confirmation restarts accrual from this date.</HelperText>
      ) : method === 'unitsPrice' ? (
        <HelperText>Prices are entered by hand and stay on this phone. No live prices are fetched.</HelperText>
      ) : null}
    </FormScreen>
  );
}
