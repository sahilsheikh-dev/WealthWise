import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';

import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { FormSection } from '../src/components/form/FormSection';
import { HelperText } from '../src/components/form/HelperText';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import {
  makeHoldingFormSchema,
  makePlanFormSchema,
  type HoldingFormInput,
  type HoldingFormOutput,
  type PlanFormInput,
  type PlanFormOutput,
} from '../src/domain/schemas';
import type { Frequency, HoldingType, ManualHolding, PlanHolding } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';
import { formatINRShort } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { projection } from '../src/domain/sip';

const holdingTypes: HoldingType[] = [
  'Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit', 'Recurring deposit', 'EPFO / PF',
  'Savings account', 'Cash', 'Gold', 'Silver', 'Other',
];
const frequencies: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

function plusDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

type InvestmentKind = 'recurring' | 'one-time';

export default function InvestmentFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const [kind, setKind] = useState<InvestmentKind>('recurring');
  const [name, setName] = useState('');
  if (holdingId && !holding) return <FormScreen title="Investment" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}><EmptyState title="Investment not found" /></FormScreen>;
  if (holding?.kind === 'plan') return <PlanEditor plan={holding} onNameChange={setName} />;
  if (holding?.kind === 'manual') return <ManualEditor holding={holding} onNameChange={setName} />;
  return (
    <View style={{ flex: 1 }}>
      {kind === 'recurring'
        ? <PlanEditor
          key="recurring"
          nameSeed={name}
          onNameChange={setName}
          modeControl={<SegmentedControl
            label="Investment type"
            value={kind}
            options={[
              { label: 'Recurring (SIP, RD...)', value: 'recurring' },
              { label: 'One-time (FD, gold, PF...)', value: 'one-time' },
            ]}
            onChange={setKind}
          />}
        />
        : <ManualEditor
          key="one-time"
          nameSeed={name}
          onNameChange={setName}
          modeControl={<SegmentedControl
            label="Investment type"
            value={kind}
            options={[
              { label: 'Recurring (SIP, RD...)', value: 'recurring' },
              { label: 'One-time (FD, gold, PF...)', value: 'one-time' },
            ]}
            onChange={setKind}
          />}
        />}
    </View>
  );
}

function PlanEditor({
  plan,
  nameSeed = '',
  onNameChange,
  modeControl,
}: {
  plan?: PlanHolding;
  nameSeed?: string;
  onNameChange: (name: string) => void;
  modeControl?: React.ReactNode;
}) {
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = todayISO();
  const { colors } = useTheme();
  const schema = useMemo(() => makePlanFormSchema(today, {
    otherNames: [...data.holdings.filter((item) => item.id !== plan?.id).map((item) => item.name), ...data.liabilities.map((item) => item.name)],
    earliestLogDate: plan?.logs.map((entry) => entry.date).sort()[0] ?? null,
  }), [data.holdings, data.liabilities, plan, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<PlanFormInput, undefined, PlanFormOutput>({
      resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
      defaultValues: plan ? {
        name: plan.name, type: plan.type, frequency: plan.frequency, amount: String(plan.amount),
        ratePct: String(plan.ratePct), stepUpPct: String(plan.stepUpPct), tenureYears: String(plan.tenureYears),
        startDate: plan.startDate, trackFrom: plan.trackFrom, opening: String(plan.opening),
        actualValue: plan.actualValue === null ? '' : String(plan.actualValue), actualValueDate: plan.actualValueDate ?? '',
      } : {
        name: nameSeed, type: 'Mutual fund / SIP', frequency: 'monthly', amount: '', ratePct: '12',
        stepUpPct: '0', tenureYears: '10', startDate: today, trackFrom: today, opening: '0',
        actualValue: '', actualValueDate: '',
      },
    });
  const amount = useWatch({ control, name: 'amount' });
  const ratePct = useWatch({ control, name: 'ratePct' });
  const stepUpPct = useWatch({ control, name: 'stepUpPct' });
  const tenureYears = useWatch({ control, name: 'tenureYears' });
  const frequency = useWatch({ control, name: 'frequency' });
  const previewValues = [amount, ratePct, stepUpPct || '0', tenureYears].map(Number);
  const preview = previewValues.every(Number.isFinite) && previewValues[0]! > 0 && previewValues[3]! > 0
    ? projection({
      ...(plan ?? { id: 'preview', kind: 'plan', name: '', type: 'Mutual fund / SIP', startDate: today, trackFrom: today, opening: 0, actualValue: null, actualValueDate: null, logs: [] }),
      amount: previewValues[0]!,
      ratePct: previewValues[1]!,
      stepUpPct: previewValues[2]!,
      tenureYears: previewValues[3]!,
      frequency: frequency as Frequency,
    })
    : null;
  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({ title: 'Discard changes?', message: 'Your changes have not been saved.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true })
      .then((discard) => { if (discard) router.back(); });
  };
  const save = (values: PlanFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (plan) actions.updatePlan(plan.id, values);
      else actions.addPlan(values);
      if (!useAppStore.getState().lastError) router.back();
    } finally { submitting.current = false; }
  };
  const remove = () => {
    if (!plan) return;
    const linkedCount = useAppStore.getState().data.transactions.filter((tx) => tx.source?.kind === 'holding-entry' && tx.source.parentId === plan.id).length;
    void choiceAsync({
      title: 'Delete investment?',
      message: `This removes ${plan.logs.length} entries and affects ${linkedCount} linked transactions.`,
      choices: [{ id: 'keep', label: 'Keep transactions' }, { id: 'delete', label: 'Delete everything', destructive: true }],
    }).then((choice) => {
      if (choice !== 'keep' && choice !== 'delete') return;
      actions.deletePlan(plan.id, { linkedTransactions: choice });
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  return (
    <FormScreen title={plan ? 'Edit Investment' : 'New Investment'} onClose={close} footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
      {plan ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || (submitCount > 0 && Object.keys(errors).length > 0)} onPress={() => void handleSubmit(save)()} />
    </View>}>
      <FormErrorBanner message={lastError} />
      {modeControl}
      {plan ? <ReadOnlyInvestmentKind label="Investment type" value="Recurring (SIP, RD...)" /> : null}
      <PlanFields control={control} errors={errors} today={today} onNameChange={onNameChange} maximumDate={plusDays(today, 366)} />
      {preview ? <AppText style={[typography.meta, { color: colors.text2 }]}>
        Projected {formatINRShort(preview.futureValue)} from {formatINRShort(preview.totalContributions)} of contributions
      </AppText> : null}
    </FormScreen>
  );
}

function ManualEditor({
  holding,
  nameSeed = '',
  onNameChange,
  modeControl,
}: {
  holding?: ManualHolding;
  nameSeed?: string;
  onNameChange: (name: string) => void;
  modeControl?: React.ReactNode;
}) {
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = todayISO();
  const schema = useMemo(() => makeHoldingFormSchema({
    otherNames: data.holdings.filter((item) => item.id !== holding?.id).map((item) => item.name),
  }), [data.holdings, holding?.id]);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<HoldingFormInput, undefined, HoldingFormOutput>({
    resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
    defaultValues: holding ? {
      name: holding.name, type: holding.type, invested: String(holding.invested), value: String(holding.value),
    } : { name: nameSeed, type: 'EPFO / PF', invested: '', value: '' },
  });
  const invested = useWatch({ control, name: 'invested' });
  const value = useWatch({ control, name: 'value' });
  const numeric = (raw: string) => Number(raw.replaceAll(',', ''));
  const belowCost = Number.isFinite(numeric(invested)) && Number.isFinite(numeric(value)) && numeric(value) < numeric(invested);
  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({ title: 'Discard changes?', message: 'Your changes have not been saved.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true })
      .then((discard) => { if (discard) router.back(); });
  };
  const save = (values: HoldingFormOutput) => {
    if (holding) actions.updateHolding(holding.id, values);
    else actions.addHolding(values);
    if (!useAppStore.getState().lastError) router.back();
  };
  const remove = () => {
    if (!holding) return;
    const linkedCount = useAppStore.getState().data.transactions.filter((tx) => tx.source?.kind === 'holding-entry' && tx.source.parentId === holding.id).length;
    void choiceAsync({
      title: 'Delete investment?',
      message: `This removes ${holding.logs.length} entries and affects ${linkedCount} linked transactions.`,
      choices: [{ id: 'keep', label: 'Keep transactions' }, { id: 'delete', label: 'Delete everything', destructive: true }],
    }).then((choice) => {
      if (choice !== 'keep' && choice !== 'delete') return;
      actions.deleteHolding(holding.id, { linkedTransactions: choice });
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  return (
    <FormScreen title={holding ? 'Edit Investment' : 'New Investment'} onClose={close} footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {holding ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || Object.keys(errors).length > 0} onPress={() => void handleSubmit(save)()} />
    </View>}>
      <FormErrorBanner message={lastError} />
      {modeControl}
      {holding ? <ReadOnlyInvestmentKind label="Investment type" value="One-time (FD, gold, PF...)" /> : null}
      <ManualFields control={control} errors={errors} onNameChange={onNameChange} />
      {holding ? <Button label="Value is still correct today" variant="soft" disabled={holding.valueAsOf === today} onPress={() => actions.confirmHoldingValue(holding.id)} /> : null}
      {belowCost ? <HelperText tone="warning">Value is below what you invested</HelperText> : null}
    </FormScreen>
  );
}

function ReadOnlyInvestmentKind({ label, value }: { label: string; value: string }) {
  return <ReadOnlyRow label={label} value={value} />;
}

function PlanFields({
  control,
  errors,
  today,
  maximumDate,
  onNameChange,
}: {
  control: Control<PlanFormInput, undefined, PlanFormOutput>;
  errors: FieldErrors<PlanFormInput>;
  today: string;
  maximumDate: string;
  onNameChange: (name: string) => void;
}) {
  return (
    <>
      <FormSection title="Basics">
        <Controller control={control} name="name" render={({ field }) => <TextField label="Name" accessibilityLabel="Investment name" maxLength={40} value={field.value} onChangeText={(value) => { field.onChange(value); onNameChange(value); }} onBlur={field.onBlur} error={errors.name?.message} />} />
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
        <Controller control={control} name="startDate" render={({ field }) => <DateField label="Start Date" accessibilityLabel="Plan start date" value={field.value} onChange={field.onChange} maximumDate={maximumDate} error={errors.startDate?.message} />} />
        <Controller control={control} name="trackFrom" render={({ field }) => <DateField label="Tracking Start Date" accessibilityLabel="Tracking start date" value={field.value || today} onChange={field.onChange} maximumDate={maximumDate} error={errors.trackFrom?.message} />} />
      </FormSection>
      <FormSection title="Opening and value">
        <Controller control={control} name="opening" render={({ field }) => <MoneyField label="Opening balance" accessibilityLabel="Opening balance" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.opening?.message} />} />
        <Controller control={control} name="actualValue" render={({ field }) => <MoneyField label="Latest actual value" accessibilityLabel="Latest actual value" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.actualValue?.message} />} />
        <Controller control={control} name="actualValueDate" render={({ field }) => <DateField label="Actual Value Date" accessibilityLabel="Actual value date" value={field.value || today} onChange={field.onChange} maximumDate={today} error={errors.actualValueDate?.message} />} />
      </FormSection>
    </>
  );
}

function ManualFields({
  control,
  errors,
  onNameChange,
}: {
  control: Control<HoldingFormInput, undefined, HoldingFormOutput>;
  errors: FieldErrors<HoldingFormInput>;
  onNameChange: (name: string) => void;
}) {
  return (
    <FormSection title="Investment">
      <Controller control={control} name="name" render={({ field }) => <TextField label="Name" accessibilityLabel="Holding name" maxLength={40} value={field.value} onChangeText={(value) => { field.onChange(value); onNameChange(value); }} onBlur={field.onBlur} error={errors.name?.message} />} />
      <Controller control={control} name="type" render={({ field }) => <ChoiceField label="Type" choices={holdingTypes} value={field.value} onChange={field.onChange} error={errors.type?.message} />} />
      <Controller control={control} name="invested" render={({ field }) => <MoneyField label="Invested" accessibilityLabel="Holding invested amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.invested?.message} />} />
      <Controller control={control} name="value" render={({ field }) => <MoneyField label="Current value" accessibilityLabel="Holding current value" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.value?.message} />} />
    </FormSection>
  );
}
