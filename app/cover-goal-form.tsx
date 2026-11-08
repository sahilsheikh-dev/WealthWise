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
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { policiesBecomingUnassigned } from '../src/domain/coverGoals';
import { COVER_POLICY_TYPES, type CoverGoal, type CoverPolicyType } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { policySummary } from '../src/domain/policySummary';

const coverGoalSchema = z.object({
  name: z.string().trim().min(1, 'Enter a cover goal name.').max(40),
  kind: z.enum(['none', 'term-life', 'health', 'motor', 'home', 'other']),
  targetMode: z.enum(['income-multiple', 'amount', 'active-only', 'none']),
  value: z.string(),
}).superRefine((values, context) => {
  if (values.targetMode === 'income-multiple'
    && (!/^[1-9]\d*$/.test(values.value) || Number(values.value) > 50)) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Enter an integer from 1 to 50.' });
  }
  if (values.targetMode === 'amount'
    && (!/^\d+(?:\.\d{1,2})?$/.test(values.value)
      || !Number.isFinite(Number(values.value))
      || Number(values.value) > 100_000_000_000)) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: 'Enter an amount from 0 to 100,000,000,000.',
    });
  }
  if ((values.targetMode === 'active-only' || values.targetMode === 'none') && values.value !== '') {
    context.addIssue({ code: 'custom', path: ['value'], message: 'This target mode does not use a value.' });
  }
});

type CoverGoalInput = z.input<typeof coverGoalSchema>;

const modeOptions: readonly DropdownOption[] = [
  { value: 'income-multiple', title: 'Income multiple' },
  { value: 'amount', title: 'Amount' },
  { value: 'active-only', title: 'Active policy only' },
  { value: 'none', title: 'No target' },
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
  const params = useLocalSearchParams<{ id?: string }>();
  const requestedId = Array.isArray(params.id) ? params.id[0] : params.id;
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const goal = requestedId === undefined
    ? undefined
    : data.coverGoals.find((item) => item.id === requestedId);
  const availableKinds = data.coverGoals.filter((item) => item.id !== goal?.id)
    .map((item) => item.kind)
    .filter((kind): kind is CoverPolicyType => kind !== null);
  const kindOptions: readonly DropdownOption[] = [
    { value: 'none', title: 'None' },
    ...COVER_POLICY_TYPES.filter((kind) => !availableKinds.includes(kind))
      .map((kind) => ({ value: kind, title: typeLabels[kind] })),
  ];
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
      name: goal?.name ?? '',
      kind: goal?.kind ?? 'none',
      targetMode: goal?.target.mode ?? 'none',
      value: goal && 'value' in goal.target ? String(goal.target.value) : '',
    },
  });
  const targetMode = useWatch({ control, name: 'targetMode' });
  const value = useWatch({ control, name: 'value' }) ?? '';
  const income = policySummary(data, today).yearlyIncomeEstimate;

  if (requestedId !== undefined && !goal) {
    return (
      <FormScreen title="Cover goal" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Cover goal not found" />
      </FormScreen>
    );
  }

  const save = handleSubmit((values) => {
    const target: CoverGoal['target'] = values.targetMode === 'income-multiple'
      ? { mode: values.targetMode, value: Number(values.value) }
      : values.targetMode === 'amount'
        ? { mode: values.targetMode, value: Number(values.value) }
        : { mode: values.targetMode };
    const input = {
      name: values.name,
      kind: values.kind === 'none' ? null : values.kind,
      target,
    };
    if (goal) actions.updateCoverGoal(goal.id, input);
    else actions.addCoverGoal(input);
    if (useAppStore.getState().lastError) return;
    router.back();
  });

  const remove = async () => {
    if (!goal) return;
    const count = policiesBecomingUnassigned(data, goal.id);
    const confirmed = await confirmAsync({
      title: `Delete ${goal.name}?`,
      message: `${count} ${count === 1 ? 'policy will' : 'policies will'} become unassigned. Policies and transactions will stay.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    actions.deleteCoverGoal(goal.id);
    if (useAppStore.getState().lastError) return;
    router.back();
  };

  const helper = targetMode === 'income-multiple' && income !== null && value !== ''
    ? `That equals ${formatAmount(income * Number(value), 'exact', 1)} a year.`
    : targetMode === 'income-multiple'
      ? income === null
        ? 'Add income or a planned budget to calculate the target amount.'
        : 'Enter a multiple from 1 to 50.'
      : targetMode === 'active-only'
        ? 'The goal is met when at least one active policy exists.'
        : targetMode === 'amount'
          ? 'Enter a fixed cover amount.'
          : 'This goal will not have a target.';

  return (
    <FormScreen
      title={goal ? 'Edit cover goal' : 'Add cover goal'}
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={goal ? { label: 'Delete cover goal', onPress: () => { void remove(); } } : undefined}
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
        name="name"
        render={({ field }) => (
          <TextField
            label="Name"
            accessibilityLabel="Cover goal name"
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
        name="kind"
        render={({ field }) => (
          <Dropdown
            label="Counts policies of type"
            accessibilityLabel="Counts policies of type"
            value={field.value}
            options={kindOptions}
            onChange={(nextKind) => {
              if (nextKind === 'none' || isCoverPolicyType(nextKind)) field.onChange(nextKind);
            }}
            error={errors.kind?.message}
          />
        )}
      />
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
              if (nextMode !== 'income-multiple' && nextMode !== 'amount'
                && nextMode !== 'active-only' && nextMode !== 'none') return;
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
      <AppText accessibilityLabel="Cover goal target help">{helper}</AppText>
    </FormScreen>
  );
}

function isCoverPolicyType(value: string): value is CoverPolicyType {
  return COVER_POLICY_TYPES.some((kind) => kind === value);
}
