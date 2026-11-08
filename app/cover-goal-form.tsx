import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Dropdown, type DropdownOption } from '../src/components/Dropdown';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { COVER_POLICY_TYPES, type CoverPolicyType } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { policySummary } from '../src/domain/policySummary';

const coverGoalSchema = z.object({
  targetMode: z.enum(['income-multiple', 'amount', 'active-only']),
  value: z.string(),
}).superRefine((values, context) => {
  if (values.targetMode === 'income-multiple'
    && (!/^[1-9]\d*$/.test(values.value) || Number(values.value) > 50)) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Enter an integer from 1 to 50.' });
  }
  if (values.targetMode === 'amount'
    && values.value !== ''
    && !/^\d+(?:\.\d{1,2})?$/.test(values.value)) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Enter a valid amount.' });
  }
  if (values.targetMode === 'active-only' && values.value !== '') {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Active-only targets do not use a value.' });
  }
});

type CoverGoalInput = z.input<typeof coverGoalSchema>;

const modeOptions: readonly DropdownOption[] = [
  { value: 'income-multiple', title: 'Income multiple' },
  { value: 'amount', title: 'Amount' },
  { value: 'active-only', title: 'Active policy only' },
];

const typeLabels: Record<CoverPolicyType, string> = {
  'term-life': 'Term life',
  health: 'Health',
  motor: 'Motor',
  home: 'Home',
  other: 'Other',
};

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function CoverGoalFormScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;
  const type = COVER_POLICY_TYPES.find((item) => item === requestedType);
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const goal = type ? data.coverGoals.find((item) => item.type === type) : undefined;
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CoverGoalInput>({
    resolver: zodResolver(coverGoalSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      targetMode: goal?.targetMode ?? (type === 'term-life' ? 'income-multiple' : 'amount'),
      value: goal?.targetValue === undefined ? '' : String(goal.targetValue),
    },
  });
  const targetMode = useWatch({ control, name: 'targetMode' });
  const value = useWatch({ control, name: 'value' }) ?? '';
  const income = policySummary(data, today).yearlyIncomeEstimate;

  if (!type || !goal) {
    return (
      <FormScreen title="Cover target" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Cover goal not found" />
      </FormScreen>
    );
  }

  const save = handleSubmit((values) => {
    const targetValue = values.targetMode === 'active-only' || values.value === ''
      ? undefined
      : Number(values.value);
    actions.setCoverGoalTarget({
      type,
      targetMode: values.targetMode,
      ...(targetValue === undefined ? {} : { targetValue }),
    });
    if (useAppStore.getState().lastError) return;
    router.back();
  });

  const helper = targetMode === 'income-multiple' && income !== null && value !== ''
    ? `That equals ${formatAmount(income * Number(value), 'exact', 1)} a year.`
    : targetMode === 'income-multiple'
      ? income === null
        ? 'Add income or a planned budget to calculate the target amount.'
        : 'Enter a multiple from 1 to 50.'
      : targetMode === 'active-only'
        ? 'The goal is met when at least one active policy exists.'
        : 'Leave the amount blank to show Set target.';

  return (
    <FormScreen
      title="Cover target"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={
        <Button
          label="Save"
          icon="save"
          variant="primary"
          disabled={isSubmitting || Object.keys(errors).length > 0}
          onPress={() => { void save(); }}
        />
      }>
      <FormErrorBanner message={lastError} />
      <Controller
        control={control}
        name="targetMode"
        render={({ field }) => (
          <Dropdown
            label="Target mode"
            accessibilityLabel="Target mode"
            value={field.value}
            options={modeOptions}
            onChange={(nextMode) => {
              if (nextMode !== 'income-multiple' && nextMode !== 'amount' && nextMode !== 'active-only') return;
              field.onChange(nextMode);
              setValue('value', '', { shouldDirty: true, shouldValidate: true });
            }}
            error={errors.targetMode?.message}
          />
        )}
      />
      {targetMode === 'income-multiple' ? (
        <Controller
          control={control}
          name="value"
          render={({ field }) => (
            <IntegerField
              label="Income multiple"
              accessibilityLabel="Income multiple"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.value?.message}
            />
          )}
        />
      ) : targetMode === 'amount' ? (
        <Controller
          control={control}
          name="value"
          render={({ field }) => (
            <MoneyField
              label="Target amount"
              accessibilityLabel="Target amount"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.value?.message}
            />
          )}
        />
      ) : null}
      <AppText accessibilityLabel={`${typeLabels[type]} cover target help`}>
        {typeLabels[type]} · {helper}
      </AppText>
    </FormScreen>
  );
}
