import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import {
  EF_BUCKETS,
  EF_BUCKET_META,
  effectiveAllocation,
  SUGGESTED_EF_ALLOCATION,
  validateAllocation,
  type EfAllocation,
} from '../src/domain/efAllocation';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

type EfBucketId = (typeof EF_BUCKETS)[number];
type AllocationFormValues = Record<EfBucketId, string>;

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

function toFormValues(allocation: EfAllocation): AllocationFormValues {
  return {
    cash: String(allocation.cash),
    bank: String(allocation.bank),
    'fd-rd': String(allocation['fd-rd']),
    'mutual-funds-bonds': String(allocation['mutual-funds-bonds']),
    stocks: String(allocation.stocks),
    insurance: String(allocation.insurance),
    other: String(allocation.other),
  };
}

export default function EfAllocationFormScreen() {
  const { colors } = useTheme();
  const allocation = useAppStore((state) => state.data.efAllocation);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const [formError, setFormError] = useState<string | undefined>();
  const { control, handleSubmit, setValue, formState: { isSubmitting } } = useForm<AllocationFormValues>({
    defaultValues: toFormValues(effectiveAllocation(allocation)),
  });

  const save = handleSubmit((values) => {
    const nextAllocation = EF_BUCKETS.reduce((result, id) => {
      result[id] = Number(values[id]);
      return result;
    }, { ...SUGGESTED_EF_ALLOCATION });
    const validation = validateAllocation(nextAllocation, true);
    if (typeof validation === 'boolean') {
      setFormError('The allocation could not be validated.');
      return;
    }
    if (!validation.valid) {
      setFormError(validation.issues.join('. '));
      return;
    }
    setFormError(undefined);
    actions.setEfAllocation(nextAllocation);
    if (!useAppStore.getState().lastError) router.back();
  });

  return (
    <FormScreen
      title="Emergency fund allocation"
      onClose={() => router.back()}
      footer={(
        <View>
          <Button label="Save allocation" variant="primary" disabled={isSubmitting} onPress={save} />
        </View>
      )}
    >
      <AppText style={[typography.meta, { color: colors.text3 }]}>
        Assign percentages to each type. The total must be exactly 100%.
      </AppText>
      <FormErrorBanner message={lastError} />
      {EF_BUCKETS.map((id) => (
        <Controller
          key={id}
          control={control}
          name={id}
          render={({ field }) => (
            <TextField
              label={`${EF_BUCKET_META[id].label} (%)`}
              accessibilityLabel={`${EF_BUCKET_META[id].label} allocation percentage`}
              value={field.value}
              onChangeText={(value) => field.onChange(value.replace(/[^\d.]/g, ''))}
              onBlur={field.onBlur}
              maxLength={5}
              placeholder="0"
            />
          )}
        />
      ))}
      {formError ? <FormErrorBanner message={formError} /> : null}
      <Button
        label="Use suggested mix"
        onPress={() => {
          EF_BUCKETS.forEach((id) => setValue(id, String(SUGGESTED_EF_ALLOCATION[id])));
        }}
      />
      <Button
        label="Reset to suggested allocation"
        onPress={() => {
          actions.resetEfAllocation();
          if (!useAppStore.getState().lastError) router.back();
        }}
      />
    </FormScreen>
  );
}
