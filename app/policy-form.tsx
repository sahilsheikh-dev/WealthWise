import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { FormScreen } from '../src/components/form/FormScreen';
import { FormSection } from '../src/components/form/FormSection';
import { MoneyField } from '../src/components/form/MoneyField';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';

const policyEditSchema = z.object({
  name: z.string().trim().min(1, 'Enter a policy name.').max(40),
  insurer: z.string().max(40),
  premium: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid premium.')
    .transform(Number).pipe(z.number().positive().max(10_000_000)),
});

type PolicyEditInput = z.input<typeof policyEditSchema>;
type PolicyEditOutput = z.output<typeof policyEditSchema>;

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function PolicyFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const policyId = Array.isArray(id) ? id[0] : id;
  const policy = useAppStore((state) => state.data.policies.find((item) => item.id === policyId));
  const actions = useAppActions();
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PolicyEditInput, undefined, PolicyEditOutput>({
    resolver: zodResolver(policyEditSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: policy?.name ?? '',
      insurer: policy?.insurer ?? '',
      premium: policy ? String(policy.premium) : '',
    },
  });

  if (!policy) {
    return (
      <FormScreen title="Policy" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Policy not found" />
      </FormScreen>
    );
  }

  const save = handleSubmit((values) => {
    actions.updatePolicy(policy.id, values);
    const error = useAppStore.getState().lastError;
    if (error) {
      Alert.alert('Could not save policy', error);
      return;
    }
    router.back();
  });

  return (
    <FormScreen
      title="Edit policy"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={<Button label="Save" variant="primary" disabled={isSubmitting} onPress={() => { void save(); }} />}>
      <FormSection title="Policy">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label="Policy name"
              accessibilityLabel="Policy name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
              maxLength={40}
            />
          )}
        />
        <Controller
          control={control}
          name="insurer"
          render={({ field }) => (
            <TextField
              label="Insurer"
              accessibilityLabel="Insurer"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.insurer?.message}
              maxLength={40}
            />
          )}
        />
        <Controller
          control={control}
          name="premium"
          render={({ field }) => (
            <MoneyField
              label="Premium"
              accessibilityLabel="Premium"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.premium?.message}
            />
          )}
        />
      </FormSection>
    </FormScreen>
  );
}
