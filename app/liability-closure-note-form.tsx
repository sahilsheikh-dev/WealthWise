import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { FormScreen } from '../src/components/form/FormScreen';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import {
  makeLiabilityClosureNoteSchema,
  type LiabilityClosureNoteFormInput,
  type LiabilityClosureNoteFormOutput,
} from '../src/domain/schemas';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityClosureNoteFormScreen() {
  const params = useLocalSearchParams<{ liabilityId?: string }>();
  const liabilityId = Array.isArray(params.liabilityId) ? params.liabilityId[0] : params.liabilityId;
  const liability = useAppStore((state) => state.data.liabilities.find((entry) => entry.id === liabilityId));
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const form = useForm<LiabilityClosureNoteFormInput, undefined, LiabilityClosureNoteFormOutput>({
    resolver: zodResolver(makeLiabilityClosureNoteSchema()),
    mode: 'onTouched',
    defaultValues: {
      note: liability?.kind === 'recurring' ? liability.closure?.note ?? '' : '',
    },
  });
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting } } = form;
  const submitting = useRef(false);

  const remove = () => {
    if (!liability) return;
    const linkedCount = data.transactions.filter((transaction) =>
      (transaction.source?.kind === 'liability-payment'
        || transaction.source?.kind === 'liability-origin'
        || transaction.source?.kind === 'liability-closure-charge')
      && transaction.source.parentId === liability.id,
    ).length;
    void choiceAsync({
      title: 'Delete closed loan?',
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

  const save = (values: LiabilityClosureNoteFormOutput) => {
    if (!liability || liability.kind !== 'recurring' || !liability.closure || submitting.current) return;
    submitting.current = true;
    try {
      actions.updateLiability(liability.id, { closureNote: values.note });
      const error = useAppStore.getState().lastError;
      if (error) void confirmAsync({ title: 'Could not save closure note', message: error, confirmLabel: 'OK' });
      else router.back();
    } finally {
      submitting.current = false;
    }
  };

  if (!liability || liability.kind !== 'recurring' || !liability.closure) {
    return (
      <FormScreen title="Closed loan" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Closed loan not found" />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Closed loan"
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={{ label: 'Delete loan', onPress: remove }}
      footer={(
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button
            label="Save note"
            icon="save"
            variant="primary"
            style={{ flex: 1 }}
            disabled={isSubmitting || Object.keys(errors).length > 0}
            onPress={() => {
              if (!submitting.current) void handleSubmit(save)();
            }}
          />
        </View>
      )}
    >
      <Controller control={control} name="note" render={({ field }) => (
        <TextField
          label="Closure note"
          accessibilityLabel="Closure note"
          maxLength={200}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={errors.note?.message}
        />
      )} />
    </FormScreen>
  );
}
