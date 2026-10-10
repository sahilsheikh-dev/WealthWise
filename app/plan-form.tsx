import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { FormSection } from '../src/components/form/FormSection';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { makePlanFormSchema, type PlanFormInput, type PlanFormOutput } from '../src/domain/schemas';
import { projection } from '../src/domain/sip';
import type { Frequency, HoldingType, PlanHolding } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';
import { formatINRShort } from '../src/lib/format';
import { useTheme } from '../src/theme/useTheme';

const holdingTypes: HoldingType[] = ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit', 'Recurring deposit', 'EPFO / PF', 'Savings account', 'Cash', 'Gold', 'Silver', 'Other'];
const frequencies: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

function plusDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function PlanFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const planId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const { colors } = useTheme();
  const today = useMemo(() => todayISO(), []);
  const plan = planId ? data.holdings.find((holding) => holding.id === planId && holding.kind === 'plan') as PlanHolding | undefined : undefined;
  const schema = useMemo(() => makePlanFormSchema(today, {
    otherNames: [...data.holdings.filter((holding) => holding.id !== planId).map((holding) => holding.name), ...data.loans.map((loan) => loan.name)],
    earliestLogDate: plan?.logs.map((log) => log.date).sort()[0] ?? null,
  }), [data.holdings, data.loans, plan, planId, today]);
  const submitting = useRef(false);
  const {
    control, handleSubmit, formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<PlanFormInput, undefined, PlanFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: plan ? {
      name: plan.name, type: plan.type, frequency: plan.frequency, amount: String(plan.amount),
      ratePct: String(plan.ratePct), stepUpPct: String(plan.stepUpPct), tenureYears: String(plan.tenureYears),
      startDate: plan.startDate, trackFrom: plan.trackFrom, opening: String(plan.opening),
      actualValue: plan.actualValue === null ? '' : String(plan.actualValue),
      actualValueDate: plan.actualValueDate ?? '',
    } : {
      name: '', type: 'Mutual fund / SIP', frequency: 'monthly', amount: '', ratePct: '12',
      stepUpPct: '0', tenureYears: '10', startDate: today, trackFrom: today, opening: '0',
      actualValue: '', actualValueDate: '',
    },
  });
  const amount = useWatch({ control, name: 'amount' });
  const ratePct = useWatch({ control, name: 'ratePct' });
  const stepUpPct = useWatch({ control, name: 'stepUpPct' });
  const tenureYears = useWatch({ control, name: 'tenureYears' });
  const frequency = useWatch({ control, name: 'frequency' });
  const projectionValues = [amount, ratePct, stepUpPct || '0', tenureYears].map(Number);
  const preview = projectionValues.every(Number.isFinite) && projectionValues[0]! > 0 && projectionValues[3]! > 0
    ? projection({
      ...(plan ?? { id: 'preview', kind: 'plan', name: '', type: 'Mutual fund / SIP', startDate: today, trackFrom: today, opening: 0, actualValue: null, actualValueDate: null, logs: [] }),
      amount: projectionValues[0]!,
      ratePct: projectionValues[1]!,
      stepUpPct: projectionValues[2]!,
      tenureYears: projectionValues[3]!,
      frequency: frequency as Frequency,
    })
    : null;

  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({
      title: 'Discard changes?',
      message: 'Your changes have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };
  const save = (values: PlanFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const input = { ...values, actualValue: values.actualValue, actualValueDate: values.actualValueDate };
      if (planId) actions.updatePlan(planId, input);
      else actions.addPlan(input);
      const error = useAppStore.getState().lastError;
      if (error) void confirmAsync({ title: 'Could not save plan', message: error, confirmLabel: 'OK' });
      else router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!plan) return;
    const linkedCount = useAppStore.getState().data.transactions.filter((transaction) => transaction.source?.kind === 'plan-log' && transaction.source.parentId === plan.id).length;
    void choiceAsync({
      title: 'Delete plan?',
      message: `This removes ${plan.logs.length} logs and affects ${linkedCount} linked transactions.`,
      choices: [
        { id: 'keep', label: 'Keep transactions' },
        { id: 'delete', label: 'Delete everything', destructive: true },
      ],
    }).then((choice) => {
      if (!choice) return;
      actions.deletePlan(plan.id, { linkedTransactions: choice === 'keep' ? 'keep' : 'delete' });
      if (!useAppStore.getState().lastError) router.back();
    });
  };

  if (planId && !plan) return <FormScreen title="Plan" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}><EmptyState title="Plan not found" /></FormScreen>;
  const hasErrors = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title={plan ? 'Edit Plan' : 'New SIP'} onClose={close} footer={<View style={styles.footer}>
      {plan ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" style={{flex: 1}} disabled={isSubmitting || hasErrors} onPress={() => void handleSubmit(save)()} />
    </View>}>
      <FormSection title="Basics">
        <Controller control={control} name="name" render={({ field }) => <TextField label="Name" accessibilityLabel="Plan name" maxLength={40} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />} />
        <Controller control={control} name="type" render={({ field }) => <ChoiceField label="Holding type" choices={holdingTypes} value={field.value} onChange={field.onChange} error={errors.type?.message} />} />
        <Controller control={control} name="frequency" render={({ field }) => <ChoiceField label="Frequency" choices={frequencies} value={field.value} onChange={field.onChange} error={errors.frequency?.message} />} />
      </FormSection>
      <FormSection title="Contribution">
        <Controller control={control} name="amount" render={({ field }) => <MoneyField value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />} />
        <Controller control={control} name="ratePct" render={({ field }) => <PercentField label="Annual return" accessibilityLabel="Annual return percentage" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.ratePct?.message} />} />
        <Controller control={control} name="stepUpPct" render={({ field }) => <PercentField label="Annual step-up" accessibilityLabel="Annual step-up percentage" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.stepUpPct?.message} />} />
        <Controller control={control} name="tenureYears" render={({ field }) => <IntegerField label="Tenure (years)" accessibilityLabel="Tenure in years" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.tenureYears?.message} />} />
      </FormSection>
      <FormSection title="Dates">
        <Controller control={control} name="startDate" render={({ field }) => <DateField label="Start Date" accessibilityLabel="Plan start date" value={field.value} onChange={field.onChange} maximumDate={plusDays(today, 366)} error={errors.startDate?.message} />} />
        <Controller control={control} name="trackFrom" render={({ field }) => <DateField label="Tracking Start Date" accessibilityLabel="Tracking start date" value={field.value || today} onChange={field.onChange} maximumDate={plusDays(today, 366)} error={errors.trackFrom?.message} />} />
      </FormSection>
      <FormSection title="Opening and value">
        <Controller control={control} name="opening" render={({ field }) => <MoneyField label="Opening balance" accessibilityLabel="Opening balance" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.opening?.message} />} />
        <Controller control={control} name="actualValue" render={({ field }) => <MoneyField label="Latest actual value" accessibilityLabel="Latest actual value" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.actualValue?.message} />} />
        <Controller control={control} name="actualValueDate" render={({ field }) => <DateField label="Actual Value Date" accessibilityLabel="Actual value date" value={field.value || today} onChange={field.onChange} maximumDate={today} error={errors.actualValueDate?.message} />} />
      </FormSection>
      {preview ? <AppText style={[styles.preview, { color: colors.text2 }]}>
        Projected {formatINRShort(preview.futureValue)} from {formatINRShort(preview.totalContributions)} of contributions
      </AppText> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({ footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, preview: { fontSize: 12, lineHeight: 18 } });
