import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { makeStopRecurringFormSchema } from '../src/domain/schemas';
import { choiceAsync } from '../src/lib/confirm';
import { todayISO } from '../src/lib/clock';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function RecurringPlanStopFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const error = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const schema = useMemo(() => makeStopRecurringFormSchema(today, holding?.logs ?? []), [holding?.logs, today]);
  const submitting = useRef(false);
  const form = useForm<z.input<typeof schema>, undefined, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { stopDate: today },
  });

  if (!holding || holding.kind !== 'plan') {
    return <FormScreen title="Stop investment" onClose={() => router.back()} isDirty={false} footer={null}>
      <EmptyState title="Plan not found" />
    </FormScreen>;
  }

  const save = (values: z.output<typeof schema>) => {
    if (submitting.current) return;
    submitting.current = true;
    void choiceAsync({
      title: 'Stop investment?',
      message: `Scheduled dues after ${values.stopDate} will be removed. Past unpaid dues on or before that date remain actionable.`,
      choices: [
        { id: 'cancel', label: 'Cancel' },
        { id: 'stop', label: 'Stop investment' },
      ],
    }).then((choice) => {
      if (choice === 'stop') {
        actions.stopPlan(holding.id, values.stopDate);
        if (!useAppStore.getState().lastError) router.back();
      }
      submitting.current = false;
    });
  };

  return (
    <FormScreen
      title="Stop investment"
      onClose={() => router.back()}
      isDirty={form.formState.isDirty}
      footer={<View style={{ flexDirection: 'row' }}>
        <Button
          label="Stop investment"
          icon="pause"
          variant="primary"
          style={{ flex: 1 }}
          disabled={form.formState.isSubmitting || Object.keys(form.formState.errors).length > 0}
          onPress={() => void form.handleSubmit(save)()}
        />
      </View>}>
      <FormErrorBanner message={error} />
      <Controller control={form.control} name="stopDate" render={({ field }) => (
        <DateField
          label="Stop date"
          accessibilityLabel="Stop investment date"
          value={field.value}
          onChange={field.onChange}
          maximumDate={today}
          error={form.formState.errors.stopDate?.message}
        />
      )} />
    </FormScreen>
  );
}
