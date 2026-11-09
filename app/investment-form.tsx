import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { Modal, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { Dropdown } from '../src/components/Dropdown';
import { DateField } from '../src/components/form/DateField';
import { FieldTitle } from '../src/components/form/FieldTitle';
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
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { pendingDues, type PastDuesMode } from '../src/domain/dues';
import { holdingCapabilities } from '../src/domain/holdingCapabilities';
import {
  makeHoldingFormSchema,
  makePlanFormSchema,
  type HoldingFormInput,
  type HoldingFormOutput,
  type PlanFormInput,
  type PlanFormOutput,
} from '../src/domain/schemas';
import { projection } from '../src/domain/sip';
import { HOLDING_TYPES, type Frequency, type ManualHolding, type PlanHolding } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';
import { suggestedValuationMethod } from '../src/domain/valuation';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const frequencies: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];
const compoundingOptions = ['monthly', 'quarterly', 'halfYearly', 'yearly', 'simple'] as const;
const valuationMethodOptions = [
  { value: 'balance', title: 'Balance' },
  { value: 'balanceInterest', title: 'Balance plus interest' },
  { value: 'accrual', title: 'Accrual estimate' },
  { value: 'manual', title: 'Manual value' },
  { value: 'unitsPrice', title: 'Units × price' },
];
const openingBalanceHint = 'Money you had already put in before you started tracking here. It counts towards your invested amount.';
const actualValueHint = "Today's value from your statement or investment app. Leave it blank and we will use our estimate.";
const actualValueDateHint = "The date you checked that value. We fill in today's date when you enter a value.";

function plusDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

type InvestmentKind = 'recurring' | 'one-time';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function InvestmentFormScreen() {
  const { id, fromTransaction } = useLocalSearchParams<{ id?: string; fromTransaction?: string }>();
  const holdingId = Array.isArray(id) ? id[0] : id;
  const isTransactionPicker = fromTransaction === '1';
  const data = useAppStore((state) => state.data);
  const holding = data.holdings.find((item) => item.id === holdingId);
  const [kind, setKind] = useState<InvestmentKind>('recurring');
  const [name, setName] = useState('');
  if (holdingId && !holding) return <FormScreen title="Investment" onClose={() => router.back()} isDirty={false} footer={null}><EmptyState title="Investment not found" /></FormScreen>;
  if (holding?.kind === 'plan') return <PlanEditor plan={holding} onNameChange={setName} />;
  if (holding?.kind === 'manual') return <ManualEditor holding={holding} onNameChange={setName} />;
  return (
    <View style={{ flex: 1 }}>
      {kind === 'recurring'
        ? <PlanEditor
          key="recurring"
          nameSeed={name}
          onNameChange={setName}
          fromTransaction={isTransactionPicker}
          modeControl={<SegmentedControl
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
          fromTransaction={isTransactionPicker}
          modeControl={<SegmentedControl
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
  fromTransaction = false,
}: {
  plan?: PlanHolding;
  nameSeed?: string;
  onNameChange: (name: string) => void;
  modeControl?: React.ReactNode;
  fromTransaction?: boolean;
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
  const { control, handleSubmit, getValues, setValue, formState: { errors, isDirty, isSubmitting, submitCount, dirtyFields } } =
    useForm<PlanFormInput, undefined, PlanFormOutput>({
      resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
      defaultValues: plan ? {
        name: plan.name, type: plan.type, frequency: plan.frequency, amount: String(plan.amount),
        ratePct: String(plan.ratePct), stepUpPct: String(plan.stepUpPct), tenureYears: String(plan.tenureYears),
        startDate: plan.startDate, trackFrom: plan.trackFrom, opening: String(plan.opening),
        actualValue: plan.actualValue === null ? '' : String(plan.actualValue), actualValueDate: plan.actualValueDate ?? '',
        valuationMethod: plan.valuationMethod ?? 'manual',
        compounding: plan.compounding ?? 'yearly',
        maturityDate: plan.maturityDate ?? '',
      } : {
        name: nameSeed, type: 'Mutual fund / SIP', frequency: 'monthly', amount: '', ratePct: '',
        stepUpPct: '', tenureYears: '', startDate: today, trackFrom: today, opening: '',
        actualValue: '', actualValueDate: '', valuationMethod: 'manual', compounding: 'yearly', maturityDate: '',
      },
    });
  const amount = useWatch({ control, name: 'amount' });
  const ratePct = useWatch({ control, name: 'ratePct' });
  const stepUpPct = useWatch({ control, name: 'stepUpPct' });
  const tenureYears = useWatch({ control, name: 'tenureYears' });
  const frequency = useWatch({ control, name: 'frequency' });
  const startDate = useWatch({ control, name: 'startDate' });
  const planType = useWatch({ control, name: 'type' });
  const opening = useWatch({ control, name: 'opening' });
  const [pastDepositsMode, setPastDepositsMode] = useState<PastDuesMode | 'show'>('settle');
  const previewValues: [number, number, number, number] = [
    Number(amount), Number(ratePct), Number(stepUpPct || '0'), Number(tenureYears),
  ];
  const [previewAmount, previewRatePct, previewStepUpPct, previewTenureYears] = previewValues;
  const previewPastDues = !plan && startDate < today
    && previewValues.every(Number.isFinite) && previewAmount > 0 && previewTenureYears > 0
    ? pendingDues({
      id: 'past-dues-preview',
      kind: 'plan',
      name: 'Preview',
      type: planType,
      frequency,
      amount: previewAmount,
      ratePct: previewRatePct,
      stepUpPct: previewStepUpPct,
      tenureYears: previewTenureYears,
      startDate,
      trackFrom: startDate,
      opening: Number(opening) || 0,
      actualValue: null,
      actualValueDate: null,
      logs: [],
    }, today)
    : null;
  const preview = previewValues.every(Number.isFinite) && previewAmount > 0 && previewTenureYears > 0
    ? projection({
      ...(plan ?? { id: 'preview', kind: 'plan', name: '', type: 'Mutual fund / SIP', startDate: today, trackFrom: today, opening: 0, actualValue: null, actualValueDate: null, logs: [] }),
      amount: previewAmount,
      ratePct: previewRatePct,
      stepUpPct: previewStepUpPct,
      tenureYears: previewTenureYears,
      frequency: frequency as Frequency,
    })
    : null;
  const save = async (values: PlanFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (plan) actions.updatePlan(plan.id, values);
      else {
        const configuredValues = dirtyFields.valuationMethod
          ? values
          : { ...values, valuationMethod: suggestedValuationMethod(values.type, false, values.ratePct) };
        if (previewPastDues?.count && pastDepositsMode !== 'show') {
          const confirmed = pastDepositsMode !== 'record' || await confirmAsync({
            title: 'Record past deposits?',
            message: `This will record ${previewPastDues.count} deposits totalling ${formatAmount(previewPastDues.amount, 'exact', 1)} on their due dates.`,
            confirmLabel: `Record ${previewPastDues.count} deposits`,
            cancelLabel: 'Cancel',
          });
          if (!confirmed) return;
          actions.addPlanWithHistory({ ...configuredValues, trackFrom: startDate }, pastDepositsMode, true);
        } else if (previewPastDues?.count) {
          actions.addPlan({ ...configuredValues, trackFrom: startDate });
        } else actions.addPlan(configuredValues);
      }
      const state = useAppStore.getState();
      if (!state.lastError) {
        if (!plan && fromTransaction) {
          const created = state.data.holdings.at(-1);
          if (created) useUIStore.getState().setLastCreatedInstrumentId(created.id);
        }
        router.back();
      }
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
    <FormScreen title="Investment plan" onClose={() => router.back()} isDirty={isDirty}
      headerAction={plan ? { label: 'Delete investment plan', onPress: remove } : undefined}
      footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
      <Button label="Save" icon="save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || (submitCount > 0 && Object.keys(errors).length > 0)} onPress={() => void handleSubmit(save)()} />
    </View>}>
      <FormErrorBanner message={lastError} />
      {modeControl}
      {plan ? <ReadOnlyInvestmentKind label="Investment type" value="Recurring (SIP, RD...)" /> : null}
      <PlanFields
        control={control}
        errors={errors}
        today={today}
        onNameChange={onNameChange}
        onActualValueEntered={() => {
          if (!getValues('actualValueDate')) {
            setValue('actualValueDate', today, { shouldDirty: true });
          }
        }}
        suggestedMethod={suggestedValuationMethod(planType, false, Number(ratePct))}
        maximumDate={plusDays(today, 366)}
      />
      {!plan && startDate < today ? (
        <View style={{ gap: 8 }}>
          <SegmentedControl
            value={pastDepositsMode}
            options={[
              { label: 'Already paid', value: 'settle' },
              { label: 'Show as due', value: 'show' },
              { label: 'Record as paid', value: 'record' },
            ]}
            onChange={setPastDepositsMode}
          />
          {previewPastDues ? (
            <HelperText>
              {previewPastDues.count} past deposits · {formatAmount(previewPastDues.amount, 'exact', 1)}
            </HelperText>
          ) : null}
        </View>
      ) : null}
      {preview ? <AppText style={[typography.meta, { color: colors.text2 }]}>
        Projected {formatAmount(preview.futureValue, 'exact', 1)} from {formatAmount(preview.totalContributions, 'exact', 1)} of contributions
      </AppText> : null}
    </FormScreen>
  );
}

function ManualEditor({
  holding,
  nameSeed = '',
  onNameChange,
  modeControl,
  fromTransaction = false,
}: {
  holding?: ManualHolding;
  nameSeed?: string;
  onNameChange: (name: string) => void;
  modeControl?: React.ReactNode;
  fromTransaction?: boolean;
}) {
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const setLastCreatedInstrumentId = useUIStore((state) => state.setLastCreatedInstrumentId);
  const today = todayISO();
  const schema = useMemo(() => makeHoldingFormSchema({
    otherNames: data.holdings.filter((item) => item.id !== holding?.id).map((item) => item.name),
    entriesExist: Boolean(holding?.logs.length),
  }), [data.holdings, holding?.id, holding?.logs.length]);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting, dirtyFields } } = useForm<HoldingFormInput, undefined, HoldingFormOutput>({
    resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
    defaultValues: holding ? {
      name: holding.name, type: holding.type, invested: String(holding.invested), value: String(holding.value),
      valuationMethod: holding.valuationMethod ?? 'manual',
      ratePct: holding.ratePct === undefined ? '' : String(holding.ratePct),
      compounding: holding.compounding ?? 'yearly',
      maturityDate: holding.maturityDate ?? '',
    } : {
      name: nameSeed, type: 'EPFO / PF', invested: '', value: '',
      valuationMethod: 'manual', ratePct: '', compounding: 'yearly', maturityDate: '',
    },
  });
  const invested = useWatch({ control, name: 'invested' });
  const value = useWatch({ control, name: 'value' });
  const holdingType = useWatch({ control, name: 'type' });
  const ratePct = useWatch({ control, name: 'ratePct' });
  const keepsEarlierEntries = Boolean(holding?.logs.length) && !holdingCapabilities(holdingType).entries;
  const numeric = (raw: string) => Number(raw.replaceAll(',', ''));
  const belowCost = Number.isFinite(numeric(invested)) && Number.isFinite(numeric(value)) && numeric(value) < numeric(invested);
  const save = (values: HoldingFormOutput) => {
    const configuredValues = !holding && !dirtyFields.valuationMethod
      ? {
        ...values,
        valuationMethod: suggestedValuationMethod(values.type, false, values.ratePct),
      }
      : values;
    if (holding) actions.updateHolding(holding.id, configuredValues);
    else actions.addHolding(configuredValues);
    const state = useAppStore.getState();
    if (!state.lastError) {
      if (!holding && fromTransaction) {
        const created = state.data.holdings.at(-1);
        if (created) setLastCreatedInstrumentId(created.id);
      }
      router.back();
    }
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
    <FormScreen title="Investment holding" onClose={() => router.back()} isDirty={isDirty}
      headerAction={holding ? { label: 'Delete investment', onPress: remove } : undefined}
      footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Button label="Save" icon="save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || Object.keys(errors).length > 0} onPress={() => void handleSubmit(save)()} />
    </View>}>
      <FormErrorBanner message={lastError} />
      {modeControl}
      {holding ? <ReadOnlyInvestmentKind label="Investment type" value="One-time (FD, gold, PF...)" /> : null}
      <ManualFields
        control={control}
        errors={errors}
        onNameChange={onNameChange}
      />
      <FormSection title="Valuation">
        <Controller control={control} name="valuationMethod" render={({ field }) => <Dropdown
          label="Valuation method"
          accessibilityLabel="Valuation method"
          options={valuationMethodOptions}
          value={field.value ?? 'manual'}
          onChange={field.onChange}
          error={errors.valuationMethod?.message}
        />} />
        <Controller control={control} name="ratePct" render={({ field }) => (
          <FieldTitle title="Annual rate">
            <PercentField
              label="Annual rate"
              accessibilityLabel="Annual accrual rate"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.ratePct?.message}
            />
          </FieldTitle>
        )} />
        <Controller control={control} name="compounding" render={({ field }) => <Dropdown
          label="Compounding"
          accessibilityLabel="Compounding"
          options={compoundingOptions.map((option) => ({ value: option, title: option }))}
          value={field.value ?? 'yearly'}
          onChange={field.onChange}
          error={errors.compounding?.message}
        />} />
        <Controller control={control} name="maturityDate" render={({ field }) => (
          <FieldTitle title="Maturity date">
            <TextField
              label="Maturity date (YYYY-MM-DD)"
              accessibilityLabel="Maturity date"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.maturityDate?.message}
            />
          </FieldTitle>
        )} />
        <HelperText>Suggested: {suggestedValuationMethod(holdingType, Boolean(holding?.logs.some((entry) => entry.price)), ratePct === '' ? undefined : Number(ratePct))}. Changing the suggestion configures this method.</HelperText>
      </FormSection>
      {keepsEarlierEntries ? <HelperText>Entries from earlier are kept.</HelperText> : null}
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
  onActualValueEntered,
  suggestedMethod,
}: {
  control: Control<PlanFormInput, undefined, PlanFormOutput>;
  errors: FieldErrors<PlanFormInput>;
  today: string;
  maximumDate: string;
  onNameChange: (name: string) => void;
  onActualValueEntered: () => void;
  suggestedMethod: string;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const { colors } = useTheme();
  return (
    <>
      <FormSection title="Basics">
        <Controller control={control} name="name" render={({ field }) => (
          <FieldTitle title="Name">
            <TextField label="Name" accessibilityLabel="Investment name" maxLength={40} value={field.value} onChangeText={(value) => { field.onChange(value); onNameChange(value); }} onBlur={field.onBlur} error={errors.name?.message} />
          </FieldTitle>
        )} />
        <Controller control={control} name="type" render={({ field }) => <Dropdown label="Holding type" accessibilityLabel="Holding type" options={HOLDING_TYPES.filter((type) => holdingCapabilities(type).recurring).map((type) => ({ value: type, title: type }))} value={field.value} onChange={field.onChange} error={errors.type?.message} />} />
        <Controller control={control} name="frequency" render={({ field }) => <Dropdown label="Frequency" accessibilityLabel="Frequency" options={frequencies.map((frequency) => ({ value: frequency, title: frequency }))} value={field.value} onChange={field.onChange} error={errors.frequency?.message} />} />
      </FormSection>
      <FormSection title="Contribution">
        <Controller control={control} name="amount" render={({ field }) => (
          <FieldTitle title="Contribution amount">
            <MoneyField label="Contribution amount" accessibilityLabel="Contribution amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />
          </FieldTitle>
        )} />
        <Controller control={control} name="ratePct" render={({ field }) => (
          <FieldTitle title="Annual return">
            <PercentField label="Annual return" accessibilityLabel="Annual return percentage" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.ratePct?.message} />
          </FieldTitle>
        )} />
        <Controller control={control} name="stepUpPct" render={({ field }) => (
          <FieldTitle title="Annual step-up">
            <PercentField label="Annual step-up" accessibilityLabel="Annual step-up percentage" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.stepUpPct?.message} />
          </FieldTitle>
        )} />
        <Controller control={control} name="tenureYears" render={({ field }) => (
          <FieldTitle title="Tenure (years)">
            <IntegerField label="Tenure (years)" accessibilityLabel="Tenure in years" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.tenureYears?.message} icon="calendar-outline" />
          </FieldTitle>
        )} />
      </FormSection>
      <FormSection title="Dates">
        <Controller control={control} name="startDate" render={({ field }) => <DateField
          label="First scheduled contribution"
          accessibilityLabel="First scheduled contribution date"
          accessibilityHint="The first date on your recurring investment schedule."
          value={field.value}
          onChange={field.onChange}
          maximumDate={maximumDate}
          error={errors.startDate?.message}
        />} />
        <HelperText>The plan schedule starts on this date.</HelperText>
        <Controller control={control} name="trackFrom" render={({ field }) => <DateField
          label="Count scheduled deposits from"
          accessibilityLabel="Scheduled deposit tracking start date"
          accessibilityHint="Only deposits due on or after this date count toward missed contributions."
          value={field.value || today}
          onChange={field.onChange}
          maximumDate={maximumDate}
          error={errors.trackFrom?.message}
        />} />
        <HelperText>For an existing SIP, choose when you want WealthWise to start counting expected deposits.</HelperText>
      </FormSection>
      <FormSection title="Opening and value">
        <Controller control={control} name="opening" render={({ field }) => (
          <FieldTitle title="Opening balance">
            <MoneyField label="Opening balance" accessibilityLabel="Opening balance" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.opening?.message} />
          </FieldTitle>
        )} />
        <HelperText accessibilityHint={openingBalanceHint}>{openingBalanceHint}</HelperText>
        <Controller control={control} name="actualValue" render={({ field }) => (
          <FieldTitle title="Latest actual value">
            <MoneyField
              label="Latest actual value"
              accessibilityLabel="Latest actual value"
              value={field.value ?? ''}
              onChangeText={(value) => {
                field.onChange(value);
                if (value.trim()) onActualValueEntered();
              }}
              onBlur={field.onBlur}
              error={errors.actualValue?.message}
            />
          </FieldTitle>
        )} />
        <HelperText accessibilityHint={actualValueHint}>{actualValueHint}</HelperText>
        <Controller control={control} name="actualValueDate" render={({ field }) => <DateField
          label="Actual value date"
          accessibilityLabel="Actual value date"
          accessibilityHint={actualValueDateHint}
          value={field.value || today}
          onChange={field.onChange}
          maximumDate={today}
          error={errors.actualValueDate?.message}
        />} />
        <HelperText accessibilityHint={actualValueDateHint}>{actualValueDateHint}</HelperText>
        <Button
          label="Investment value example"
          icon="info"
          accessibilityHint="Opens a worked example for the investment value fields."
          onPress={() => setInfoOpen(true)}
        />
        <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
            <View
              accessibilityViewIsModal
              style={{ padding: 20, paddingBottom: 34, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface }}>
              <AppText weight="bold">Investment value example</AppText>
              <AppText
                accessibilityLabel={`For example, you had ${formatAmount(10_000, 'exact', 1)} put in before tracking. This counts toward invested amount. Your statement now shows ${formatAmount(11_000, 'exact', 1)} on the date you checked it.`}>
                For example, you had <AmountText value={10_000} tier="row" /> put in before tracking. This counts toward invested amount. Your statement now shows <AmountText value={11_000} tier="row" /> on the date you checked it.
              </AppText>
              <Button
                label="Close investment value example"
                icon="x"
                onPress={() => setInfoOpen(false)}
              />
            </View>
          </View>
        </Modal>
      </FormSection>
      <FormSection title="Valuation">
        <Controller control={control} name="valuationMethod" render={({ field }) => <Dropdown
          label="Valuation method"
          accessibilityLabel="Valuation method"
          options={valuationMethodOptions}
          value={field.value ?? 'manual'}
          onChange={field.onChange}
          error={errors.valuationMethod?.message}
        />} />
        <Controller control={control} name="compounding" render={({ field }) => <Dropdown
          label="Compounding"
          accessibilityLabel="Compounding"
          options={compoundingOptions.map((option) => ({ value: option, title: option }))}
          value={field.value ?? 'yearly'}
          onChange={field.onChange}
          error={errors.compounding?.message}
        />} />
        <Controller control={control} name="maturityDate" render={({ field }) => (
          <FieldTitle title="Maturity date">
            <TextField
              label="Maturity date (YYYY-MM-DD)"
              accessibilityLabel="Maturity date"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.maturityDate?.message}
            />
          </FieldTitle>
        )} />
        <HelperText>
          Accrual uses this plan&apos;s annual return rate. Suggested: {suggestedMethod}.
        </HelperText>
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
      <Controller control={control} name="name" render={({ field }) => (
        <FieldTitle title="Name">
          <TextField label="Name" accessibilityLabel="Holding name" maxLength={40} value={field.value} onChangeText={(value) => { field.onChange(value); onNameChange(value); }} onBlur={field.onBlur} error={errors.name?.message} />
        </FieldTitle>
      )} />
      <Controller control={control} name="type" render={({ field }) => <Dropdown label="Type" accessibilityLabel="Holding type" options={HOLDING_TYPES.map((type) => ({ value: type, title: type }))} value={field.value} onChange={field.onChange} error={errors.type?.message} />} />
      <Controller control={control} name="invested" render={({ field }) => (
        <FieldTitle title="Invested">
          <MoneyField label="Invested" accessibilityLabel="Holding invested amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.invested?.message} />
        </FieldTitle>
      )} />
      <Controller control={control} name="value" render={({ field }) => (
        <FieldTitle title="Current value">
          <MoneyField label="Current value" accessibilityLabel="Holding current value" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.value?.message} />
        </FieldTitle>
      )} />
    </FormSection>
  );
}
