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
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { isValidISO } from '../src/domain/dates';
import type { Policy, PolicyFrequency, PolicyKind } from '../src/domain/types';
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
  premium: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid premium.')
    .transform(Number).pipe(z.number().positive().max(10_000_000)),
  frequency: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly', 'custom']),
  customIntervalMonths: z.string(),
  nextDueDate: z.string(),
  policyNumber: optionalText(30),
  sumAssured: optionalAmountSchema,
  note: optionalText(120),
}).superRefine((values, context) => {
  if (!isValidISO(values.nextDueDate)) {
    context.addIssue({ code: 'custom', path: ['nextDueDate'], message: 'Choose a valid next due date.' });
  }
  if (values.frequency === 'custom') {
    const interval = Number(values.customIntervalMonths);
    if (!Number.isInteger(interval) || interval < 1 || interval > 120) {
      context.addIssue({ code: 'custom', path: ['customIntervalMonths'], message: 'Enter an interval from 1 to 120 months.' });
    }
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
  { value: 'custom', title: 'Custom' },
];

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function PolicyFormScreen() {
  const { colors } = useTheme();
  const { id, kind: requestedKind, name: requestedName } = useLocalSearchParams<{ id?: string; kind?: string; name?: string }>();
  const policyId = Array.isArray(id) ? id[0] : id;
  const initialKind = Array.isArray(requestedKind) ? requestedKind[0] : requestedKind;
  const initialName = Array.isArray(requestedName) ? requestedName[0] : requestedName;
  const policy = useAppStore((state) => state.data.policies.find((item) => item.id === policyId));
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
      name: policy?.name ?? initialName ?? '',
      insurer: policy?.insurer ?? '',
      kind: policy?.kind ?? (isPolicyKind(initialKind) ? initialKind : 'other'),
      premium: policy ? String(policy.premium) : '',
      frequency: policy?.frequency ?? 'yearly',
      customIntervalMonths: policy?.customIntervalMonths === undefined ? '1' : String(policy.customIntervalMonths),
      nextDueDate: policy?.trackFrom ?? today,
      policyNumber: policy?.policyNumber ?? '',
      sumAssured: policy?.sumAssured === undefined ? '' : String(policy.sumAssured),
      note: policy?.note ?? '',
    },
  });
  const kind = useWatch({ control, name: 'kind' });
  const frequency = useWatch({ control, name: 'frequency' });

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
      message: 'Upcoming premium dues will be removed. Recorded payments stay in Transactions.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    actions.deletePolicy(policy.id);
    if (useAppStore.getState().lastError) return;
    router.back();
  };

  const save = handleSubmit((values) => {
    const patch = buildPolicyPatch(values);
    if (policy) actions.updatePolicy(policy.id, patch);
    else {
      actions.addPolicy({
        ...patch,
        name: values.name,
        insurer: values.insurer,
        kind: values.kind,
        premium: values.premium,
        frequency: values.frequency,
        startDate: values.nextDueDate,
        status: 'active',
        premiumYears: 80,
        trackFrom: values.nextDueDate,
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
              label="Type"
              accessibilityLabel="Policy type"
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
        {frequency === 'custom' ? (
          <Controller
            control={control}
            name="customIntervalMonths"
            render={({ field }) => (
              <TextField
                label="Custom interval (months)"
                accessibilityLabel="Custom interval in months"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.customIntervalMonths?.message}
              />
            )}
          />
        ) : null}
        <Controller
          control={control}
          name="nextDueDate"
          render={({ field }) => (
            <DateField
              label="Next due date"
              accessibilityLabel="Next premium due date"
              value={field.value}
              onChange={field.onChange}
              maximumDate="2100-12-31"
              error={errors.nextDueDate?.message}
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
        {kind === 'life-savings' || kind === 'ulip' ? (
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            Savings value remains managed with your investment records.
          </AppText>
        ) : null}
      </FormSection>
    </FormScreen>
  );
}

function buildPolicyPatch(values: PolicyFormOutput): Partial<Omit<Policy, 'id' | 'payments' | 'status'>> {
  return {
    name: values.name,
    insurer: values.insurer,
    kind: values.kind,
    premium: values.premium,
    frequency: values.frequency,
    ...(values.frequency === 'custom'
      ? { customIntervalMonths: Number(values.customIntervalMonths) }
      : { customIntervalMonths: undefined }),
    trackFrom: values.nextDueDate,
    policyNumber: values.policyNumber,
    sumAssured: values.sumAssured,
    note: values.note,
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
  return value === 'monthly' || value === 'quarterly' || value === 'half-yearly'
    || value === 'yearly' || value === 'custom';
}

const styles = StyleSheet.create({ footer: { gap: 8 } });
