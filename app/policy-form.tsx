import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Dropdown, type DropdownOption } from '../src/components/Dropdown';
import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { FormSection } from '../src/components/form/FormSection';
import { MoneyField } from '../src/components/form/MoneyField';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { isValidISO } from '../src/domain/dates';
import type { Policy, PolicyFrequency, PolicyKind, PolicyStatus } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const optionalAmountSchema = z.string().transform((value) => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : Number(trimmed);
}).refine((value) => value === undefined || (Number.isFinite(value) && value >= 0 && value <= 100_000_000_000), {
  message: 'Enter an amount from 0 to 100,000,000,000.',
});
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || undefined);

const policyFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a policy name.').max(40),
  insurer: z.string().trim().max(40),
  kind: z.enum(['term-life', 'health', 'life-savings', 'ulip', 'motor', 'home', 'other']),
  coverGoalId: z.string(),
  premium: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid premium.')
    .transform(Number).pipe(z.number().positive().max(10_000_000)),
  frequency: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly']),
  startDate: z.string(),
  hasEndDate: z.boolean(),
  endDate: z.string(),
  policyNumber: optionalText(30),
  sumAssured: optionalAmountSchema,
  nominee: optionalText(40),
  note: optionalText(120),
  status: z.enum(['active', 'lapsed', 'matured', 'cancelled']),
}).superRefine((values, context) => {
  if (!isValidISO(values.startDate)) {
    context.addIssue({ code: 'custom', path: ['startDate'], message: 'Choose a valid start date.' });
  }
  if (values.hasEndDate && (!isValidISO(values.endDate) || values.endDate <= values.startDate)) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after the start date.' });
  }
});

type PolicyFormInput = z.input<typeof policyFormSchema>;
type PolicyFormOutput = z.output<typeof policyFormSchema>;

const kindOptions: readonly DropdownOption[] = [
  { value: 'term-life', title: 'Term life' },
  { value: 'health', title: 'Health' },
  { value: 'life-savings', title: 'Life savings' },
  { value: 'ulip', title: 'ULIP' },
  { value: 'motor', title: 'Motor' },
  { value: 'home', title: 'Home' },
  { value: 'other', title: 'Other' },
];
const frequencyOptions: readonly DropdownOption[] = [
  { value: 'monthly', title: 'Monthly' },
  { value: 'quarterly', title: 'Quarterly' },
  { value: 'half-yearly', title: 'Half-yearly' },
  { value: 'yearly', title: 'Yearly' },
];
const statusOptions: readonly DropdownOption[] = [
  { value: 'active', title: 'Active' },
  { value: 'lapsed', title: 'Lapsed' },
  { value: 'matured', title: 'Matured' },
  { value: 'cancelled', title: 'Cancelled' },
];

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function PolicyFormScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const policyId = Array.isArray(id) ? id[0] : id;
  const policy = useAppStore((state) => state.data.policies.find((item) => item.id === policyId));
  const coverGoals = useAppStore((state) => state.data.coverGoals);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = todayISO();
  const editing = policyId !== undefined;
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<PolicyFormInput, undefined, PolicyFormOutput>({
    resolver: zodResolver(policyFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: policy?.name ?? '',
      insurer: policy?.insurer ?? '',
      kind: policy?.kind ?? 'other',
      coverGoalId: policy?.coverGoalId ?? 'automatic',
      premium: policy ? String(policy.premium) : '',
      frequency: policy?.frequency ?? 'yearly',
      startDate: policy?.startDate ?? today,
      hasEndDate: policy?.endDate !== undefined,
      endDate: policy?.endDate ?? today,
      policyNumber: policy?.policyNumber ?? '',
      sumAssured: policy?.sumAssured === undefined ? '' : String(policy.sumAssured),
      nominee: policy?.nominee ?? '',
      note: policy?.note ?? '',
      status: policy?.status ?? 'active',
    },
  });
  const hasEndDate = useWatch({ control, name: 'hasEndDate' });
  const kind = useWatch({ control, name: 'kind' });

  if (editing && !policy) {
    return (
      <FormScreen title="Policy" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Policy not found" />
      </FormScreen>
    );
  }

  const remove = async () => {
    if (!policy) return;
    const confirmed = await confirmAsync({
      title: `Delete ${policy.name}?`,
      message: 'Recorded premium payments stay in Transactions.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    actions.deletePolicy(policy.id);
    if (useAppStore.getState().lastError) return;
    router.back();
  };

  const save = handleSubmit((values) => {
    const patch: Partial<Omit<Policy, 'id' | 'payments'>> = buildPolicyPatch(values);
    if (policy) actions.updatePolicy(policy.id, patch);
    else {
      actions.addPolicy({
        ...patch,
        name: values.name,
        insurer: values.insurer,
        kind: values.kind,
        premium: values.premium,
        frequency: values.frequency,
        startDate: values.startDate,
        status: values.status,
        premiumYears: 80,
        trackFrom: values.startDate,
        currentValue: null,
        valueAsOf: null,
      });
    }
    if (useAppStore.getState().lastError) return;
    router.back();
  });

  const errorCount = Object.keys(errors).length;
  return (
    <FormScreen
      title={policy ? 'Edit policy' : 'Policy'}
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={policy ? { label: 'Delete policy', onPress: () => { void remove(); } } : undefined}
      footer={
        <View style={styles.footer}>
          {submitCount > 0 && errorCount > 0 ? (
            <AppText style={[typography.meta, { color: colors.err }]}>
              Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'}
            </AppText>
          ) : null}
          <Button
            label="Save"
            icon="save"
            variant="primary"
            disabled={isSubmitting || (submitCount > 0 && errorCount > 0)}
            onPress={() => { void save(); }}
          />
        </View>
      }>
      <FormErrorBanner message={lastError} />
      <FormSection title="Policy">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label="Name"
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
          name="kind"
          render={({ field }) => (
            <Dropdown
              label="Kind"
              accessibilityLabel="Policy kind"
              value={field.value}
              options={kindOptions}
              onChange={(value) => {
                if (isPolicyKind(value)) field.onChange(value);
              }}
              error={errors.kind?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="coverGoalId"
          render={({ field }) => (
            <Dropdown
              label="Counts toward"
              accessibilityLabel="Counts toward"
              value={field.value}
              options={[
                { value: 'automatic', title: 'Automatic by type' },
                ...coverGoals.map((goal) => ({ value: goal.id, title: goal.name })),
              ]}
              onChange={field.onChange}
              error={errors.coverGoalId?.message}
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
        <Controller
          control={control}
          name="frequency"
          render={({ field }) => (
            <Dropdown
              label="Frequency"
              accessibilityLabel="Premium frequency"
              value={field.value}
              options={frequencyOptions}
              onChange={(value) => {
                if (isPolicyFrequency(value)) field.onChange(value);
              }}
              error={errors.frequency?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <DateField
              label="Start date"
              accessibilityLabel="Policy start date"
              value={field.value}
              onChange={field.onChange}
              maximumDate={today}
              error={errors.startDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="sumAssured"
          render={({ field }) => (
            <MoneyField
              label="Sum assured"
              accessibilityLabel="Sum assured"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.sumAssured?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="hasEndDate"
          render={({ field }) => (
            <SwitchRow label="End date enabled" value={field.value} onValueChange={field.onChange} />
          )}
        />
        {hasEndDate ? (
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DateField
                label="End date"
                accessibilityLabel="Policy end date"
                value={field.value}
                onChange={field.onChange}
                maximumDate="2100-12-31"
                error={errors.endDate?.message}
              />
            )}
          />
        ) : null}
        <Controller
          control={control}
          name="policyNumber"
          render={({ field }) => (
            <TextField
              label="Policy number"
              accessibilityLabel="Policy number"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.policyNumber?.message}
              maxLength={30}
            />
          )}
        />
        <Controller
          control={control}
          name="nominee"
          render={({ field }) => (
            <TextField
              label="Nominee"
              accessibilityLabel="Nominee"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.nominee?.message}
              maxLength={40}
            />
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextField
              label="Note"
              accessibilityLabel="Policy note"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.note?.message}
              maxLength={120}
            />
          )}
        />
        {policy ? (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Dropdown
                label="Status"
                accessibilityLabel="Policy status"
                value={field.value}
                options={statusOptions}
                onChange={(value) => {
                  if (isPolicyStatus(value)) field.onChange(value);
                }}
                error={errors.status?.message}
              />
            )}
          />
        ) : null}
        {kind === 'life-savings' || kind === 'ulip' ? (
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            Savings value remains managed with your investment records.
          </AppText>
        ) : null}
      </FormSection>
    </FormScreen>
  );
}

function buildPolicyPatch(values: PolicyFormOutput): Partial<Omit<Policy, 'id' | 'payments'>> {
  return {
    name: values.name,
    insurer: values.insurer,
    kind: values.kind,
    coverGoalId: values.coverGoalId === 'automatic' ? undefined : values.coverGoalId,
    premium: values.premium,
    frequency: values.frequency,
    startDate: values.startDate,
    status: values.status,
    ...(values.policyNumber === undefined ? {} : { policyNumber: values.policyNumber }),
    ...(values.sumAssured === undefined ? {} : { sumAssured: values.sumAssured }),
    ...(values.hasEndDate ? { endDate: values.endDate } : { endDate: undefined }),
    ...(values.nominee === undefined ? {} : { nominee: values.nominee }),
    ...(values.note === undefined ? {} : { note: values.note }),
    ...(values.kind === 'life-savings' || values.kind === 'ulip'
      ? {}
      : { currentValue: null, valueAsOf: null }),
  };
}

function isPolicyKind(value: string): value is PolicyKind {
  return value === 'term-life' || value === 'health' || value === 'life-savings'
    || value === 'ulip' || value === 'motor' || value === 'home' || value === 'other';
}

function isPolicyFrequency(value: string): value is PolicyFrequency {
  return value === 'monthly' || value === 'quarterly' || value === 'half-yearly' || value === 'yearly';
}

function isPolicyStatus(value: string): value is PolicyStatus {
  return value === 'active' || value === 'lapsed' || value === 'matured' || value === 'cancelled';
}

const styles = StyleSheet.create({ footer: { gap: 8 } });
