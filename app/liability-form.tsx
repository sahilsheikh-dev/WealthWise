import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Switch, View } from 'react-native';

import { Dropdown } from '../src/components/Dropdown';
import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { HelperText } from '../src/components/form/HelperText';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, Chip, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { pendingDues, type PastDuesMode } from '../src/domain/dues';
import { solveLoan } from '../src/domain/liability';
import { makeLiabilityFormSchema, type LiabilityFormInput, type LiabilityFormOutput } from '../src/domain/schemas';
import { LIABILITY_TYPES } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';

const kindOptions = [
  { label: 'Recurring (EMI)', value: 'recurring' },
  { label: 'One-time', value: 'one-time' },
] as const;

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const liabilityId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const liability = data.liabilities.find((item) => item.id === liabilityId);
  const schema = useMemo(() => makeLiabilityFormSchema(today, {
    otherNames: [
      ...data.liabilities.filter((item) => item.id !== liabilityId).map((item) => item.name),
      ...data.holdings.map((holding) => holding.name),
    ],
    earliestPaymentDate: liability?.payments.map((payment) => payment.date).sort()[0] ?? null,
  }), [data.holdings, data.liabilities, liability?.payments, liabilityId, today]);
  const submitting = useRef(false);
  const receivedTouched = useRef(false);
  const { control, handleSubmit, setValue, formState: { isDirty, isSubmitting, errors, submitCount } } =
    useForm<LiabilityFormInput, undefined, LiabilityFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: liability
        ? liability.kind === 'recurring'
          ? {
            kind: 'recurring',
            name: liability.name,
            type: liability.type,
            principal: String(liability.principal),
            ratePct: String(liability.ratePct),
            tenureMonths: String(liability.tenureMonths),
            startDate: liability.startDate,
            emi: String(liability.emi),
            dueDate: '',
            received: false,
          }
          : {
            kind: 'one-time',
            name: liability.name,
            type: liability.type,
            principal: String(liability.principal),
            ratePct: String(liability.ratePct),
            startDate: liability.startDate,
            dueDate: liability.dueDate ?? '',
            tenureMonths: '',
            emi: '',
            received: false,
          }
        : {
          kind: 'recurring',
          name: '',
          type: 'Other',
          principal: '',
          ratePct: '',
          tenureMonths: '',
          startDate: today,
          emi: '',
          dueDate: '',
          received: true,
        },
    });
  const kind = useWatch({ control, name: 'kind' });
  const principal = useWatch({ control, name: 'principal' });
  const rate = useWatch({ control, name: 'ratePct' });
  const startDate = useWatch({ control, name: 'startDate' });
  const liabilityType = useWatch({ control, name: 'type' });
  const tenure = useWatch({ control, name: 'tenureMonths' }) ?? '';
  const emi = useWatch({ control, name: 'emi' }) ?? '';
  const received = useWatch({ control, name: 'received' });
  const startsBeforeCurrentMonth = startDate.length === 10
    && startDate.slice(0, 7) < today.slice(0, 7);
  useEffect(() => {
    if (!liabilityId && !receivedTouched.current) {
      setValue('received', !startsBeforeCurrentMonth);
    }
  }, [liabilityId, setValue, startsBeforeCurrentMonth]);
  const principalValue = Number(principal);
  const solverInputCount = [rate.trim(), tenure.trim(), emi.trim()].filter(Boolean).length;
  const solver = useMemo(() => {
    if (kind !== 'recurring' || !Number.isFinite(principalValue) || principalValue <= 0) {
      return { result: null, error: null };
    }
    try {
      return {
        result: solveLoan({
          principal: principalValue,
          ...(rate.trim() ? { ratePct: Number(rate) } : {}),
          ...(tenure.trim() ? { tenureMonths: Number(tenure) } : {}),
          ...(emi.trim() ? { emi: Number(emi) } : {}),
        }),
        error: null,
      };
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return { result: null, error: error.message };
    }
  }, [emi, kind, principalValue, rate, tenure]);
  const calculated = solver.result;
  const underTenure = calculated?.solved === 'none' && calculated.emi !== null
    && calculated.tenureMonths !== null && calculated.emi * calculated.tenureMonths < principalValue;
  const calculatedEmi = calculated?.solved === 'emi' ? calculated.emi : null;
  const calculatedRate = calculated?.solved === 'rate' ? calculated.ratePct : null;
  const calculatedTenure = calculated?.solved === 'tenure' ? calculated.tenureMonths : null;
  const [pastInstallmentsMode, setPastInstallmentsMode] = useState<PastDuesMode | 'show'>('settle');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const previewPastDues = !liabilityId && kind === 'recurring' && startDate < today
    && calculated?.ratePct !== null && calculated?.ratePct !== undefined
    && calculated.tenureMonths !== null && calculated.emi !== null
    ? pendingDues({
      id: 'past-dues-preview',
      kind: 'recurring',
      name: 'Preview',
      type: liabilityType,
      principal: principalValue,
      ratePct: calculated.ratePct,
      startDate,
      tenureMonths: calculated.tenureMonths,
      emi: calculated.emi,
      payments: [],
      settlement: null,
    }, today)
    : null;

  const save = async (values: LiabilityFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (liabilityId) {
        const { kind: _kind, received: _received, ...patch } = values;
        actions.updateLiability(liabilityId, patch);
      }
      else if (values.received) {
        const { received: _received, ...input } = values;
        actions.recordMoneyMovement({
          kind: 'loan-received',
          amount: values.principal,
          date: values.startDate,
          liability: input,
        });
      }
      else if (previewPastDues?.count && pastInstallmentsMode !== 'show') {
        const confirmed = pastInstallmentsMode !== 'record' || await confirmAsync({
          title: 'Record past installments?',
          message: `This will record ${previewPastDues.count} installments totalling ${formatAmount(previewPastDues.amount, 'exact', 1)} on their due dates.`,
          confirmLabel: `Record ${previewPastDues.count} installments`,
          cancelLabel: 'Cancel',
        });
        if (!confirmed) return;
        actions.addLiabilityWithHistory(
          (({ received: _received, ...input }) => input)(values),
          pastInstallmentsMode,
          outstandingBalance.trim() ? Number(outstandingBalance) : undefined,
        );
      } else {
        const { received: _received, ...input } = values;
        actions.addLiability(input);
      }
      const error = useAppStore.getState().lastError;
      if (error) void confirmAsync({ title: 'Could not save liability', message: error, confirmLabel: 'OK' });
      else router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!liability) return;
    const linkedCount = useAppStore.getState().data.transactions.filter((transaction) =>
      (transaction.source?.kind === 'liability-payment' || transaction.source?.kind === 'liability-origin') &&
      transaction.source.parentId === liability.id,
    ).length;
    void choiceAsync({
      title: 'Delete liability?',
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
  if (liabilityId && !liability) return (
    <FormScreen title="Liability" onClose={() => router.back()} isDirty={false} footer={null}>
      <EmptyState title="Liability not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title="Liability" onClose={() => router.back()} isDirty={isDirty}
      headerAction={liability ? { label: 'Delete liability', onPress: remove } : undefined}
      footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Button label="Save" icon="save" variant="primary" style={{ flex: 1 }} disabled={isSubmitting || errorsVisible} onPress={() => {
        if (!submitting.current) void handleSubmit(save)();
      }} />
    </View>}>
      {liability ? <ReadOnlyRow label="Liability kind" value={liability.kind === 'recurring' ? 'Recurring (EMI)' : 'One-time'} /> : (
        <Controller control={control} name="kind" render={({ field }) => (
          <SegmentedControl
            options={kindOptions}
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              if (next === 'one-time') setValue('ratePct', rate || '0', { shouldDirty: true });
            }}
            error={errors.kind?.message}
          />
        )} />
      )}
      <Controller control={control} name="name" render={({ field }) => (
        <TextField label="Name" accessibilityLabel="Liability name" maxLength={40} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />
      )} />
      <Controller control={control} name="type" render={({ field }) => (
        <Dropdown label="Type" accessibilityLabel="Liability type" options={LIABILITY_TYPES.map((type) => ({ value: type, title: type }))} value={field.value} onChange={field.onChange} error={errors.type?.message} />
      )} />
      {!liabilityId ? (
        <Controller control={control} name="received" render={({ field }) => (
          <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText weight="semibold">I received this money in my account</AppText>
              <HelperText>
                {kind === 'recurring'
                  ? 'Also record the loan proceeds as money received.'
                  : 'Also record the borrowed amount as money received.'}
              </HelperText>
              {!receivedTouched.current && startsBeforeCurrentMonth ? (
                <HelperText>This loan started before this month, so we left this off to avoid changing that month&apos;s balance</HelperText>
              ) : null}
            </View>
            <Switch
              accessibilityLabel="I received this money in my account"
              value={field.value}
              onValueChange={(next) => {
                receivedTouched.current = true;
                field.onChange(next);
              }}
            />
          </View>
        )} />
      ) : null}
      <Controller control={control} name="principal" render={({ field }) => (
        <MoneyField label={kind === 'one-time' ? 'Amount borrowed' : 'Principal'} accessibilityLabel={kind === 'one-time' ? 'Amount borrowed' : 'Liability principal'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.principal?.message} />
      )} />
      <Controller control={control} name="ratePct" render={({ field }) => (
        <PercentField label="Annual interest rate" accessibilityLabel="Annual interest rate" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.ratePct?.message} />
      )} />
      {kind === 'recurring' ? (
        <Chip
          label="No interest"
          selected={rate.trim() === '0'}
          onPress={() => setValue('ratePct', '0', { shouldDirty: true, shouldValidate: true })}
        />
      ) : null}
      <Controller control={control} name="startDate" render={({ field }) => (
        <DateField label="Start date" value={field.value} onChange={field.onChange} maximumDate={today} error={errors.startDate?.message} accessibilityLabel="Liability start date" />
      )} />
      {kind === 'recurring' ? (
        <>
          <Controller control={control} name="tenureMonths" render={({ field }) => (
            <IntegerField label="Tenure (months)" accessibilityLabel="Liability tenure in months" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.tenureMonths?.message} icon="calendar-outline"/>
          )} />
          <Controller control={control} name="emi" render={({ field }) => (
            <MoneyField label="EMI (optional)" accessibilityLabel="Liability EMI" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.emi?.message} />
          )} />
          {solverInputCount < 2 ? (
            <HelperText>Add one more of tenure, interest rate or EMI so we can work out the rest</HelperText>
          ) : null}
          {solver.error ? <HelperText tone="warning">{solver.error}</HelperText> : null}
          {calculatedEmi !== null ? (
            <ReadOnlyRow label="Calculated EMI" value={formatAmount(calculatedEmi, 'exact', 1)} />
          ) : null}
          {calculatedRate !== null ? (
            <ReadOnlyRow label="Calculated annual interest rate" value={`${calculatedRate.toFixed(2)}%`} />
          ) : null}
          {calculatedTenure !== null ? (
            <View style={{ gap: 6 }}>
              <ReadOnlyRow label="Calculated tenure" value={`${calculatedTenure} months`} />
              {calculated?.lastPayment !== null && calculated?.lastPayment !== undefined ? (
                <HelperText>Final payment: {formatAmount(calculated.lastPayment, 'exact', 1)}</HelperText>
              ) : null}
            </View>
          ) : null}
          {calculated?.warnings.map((warning) => (
            <View key={warning.kind} style={{ gap: 6 }}>
              <HelperText tone="warning">
                These do not match: the EMI for this rate and tenure would be {formatAmount(warning.calculatedEmi, 'exact', 1)}
              </HelperText>
              <Button
                label="Use calculated EMI"
                icon="check"
                onPress={() => setValue('emi', String(warning.calculatedEmi), { shouldDirty: true, shouldValidate: true })}
              />
            </View>
          ))}
          {underTenure ? <HelperText tone="warning">This EMI won&apos;t repay the liability within the tenure</HelperText> : null}
        </>
      ) : (
        <Controller control={control} name="dueDate" render={({ field }) => (
          <TextField
            label="Due date (optional, YYYY-MM-DD)"
            accessibilityLabel="Liability due date"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.dueDate?.message}
          />
        )} />
      )}
      {!liabilityId && !received && kind === 'recurring' && startDate < today ? (
        <View style={{ gap: 8 }}>
          <AppText weight="semibold">Past installments</AppText>
          <SegmentedControl
            value={pastInstallmentsMode}
            options={[
              { label: 'Already paid', value: 'settle' },
              { label: 'Show as due', value: 'show' },
              { label: 'Record as paid', value: 'record' },
            ]}
            onChange={setPastInstallmentsMode}
          />
          {previewPastDues ? (
            <HelperText>
              {previewPastDues.count} past installments · {formatAmount(previewPastDues.amount, 'exact', 1)}
            </HelperText>
          ) : null}
          {pastInstallmentsMode === 'settle' ? (
            <>
              <MoneyField
                label="Outstanding balance today"
                accessibilityLabel="Outstanding balance today"
                value={outstandingBalance}
                onChangeText={setOutstandingBalance}
              />
              <HelperText>
                If this loan started in the past, enter what you still owe so old EMIs do not show as due.
              </HelperText>
            </>
          ) : null}
        </View>
      ) : null}
    </FormScreen>
  );
}
