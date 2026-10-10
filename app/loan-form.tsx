import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button, EmptyState } from '../src/components/ui';
import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { IntegerField } from '../src/components/form/IntegerField';
import { HelperText } from '../src/components/form/HelperText';
import { TextField } from '../src/components/form/TextField';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { emiAuto } from '../src/domain/loan';
import { makeLoanFormSchema, type LoanFormInput, type LoanFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { formatINR } from '../src/lib/format';
import { choiceAsync, confirmAsync } from '../src/lib/confirm';

export default function LoanFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loanId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const loan = data.loans.find((item) => item.id === loanId);
  const schema = useMemo(() => makeLoanFormSchema(today, {
    otherNames: [...data.loans.filter((item) => item.id !== loanId).map((item) => item.name), ...data.holdings.map((holding) => holding.name)],
    earliestPaymentDate: loan?.payments.map((payment) => payment.date).sort()[0] ?? null,
  }), [data.holdings, data.loans, loan?.payments, loanId, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, setValue, formState: { isDirty, isSubmitting, errors, submitCount } } = useForm<LoanFormInput, undefined, LoanFormOutput>({
    resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange',
    defaultValues: loan ? {
      name: loan.name, principal: String(loan.principal), ratePct: String(loan.ratePct),
      tenureMonths: String(loan.tenureMonths), startDate: loan.startDate, emi: String(loan.emi),
    } : { name: '', principal: '', ratePct: '', tenureMonths: '', startDate: today, emi: '' },
  });
  const principal = useWatch({ control, name: 'principal' });
  const rate = useWatch({ control, name: 'ratePct' });
  const tenure = useWatch({ control, name: 'tenureMonths' });
  const emi = useWatch({ control, name: 'emi' });
  const principalValue = Number(principal);
  const rateValue = Number(rate);
  const tenureValue = Number(tenure);
  const calculated = principalValue > 0 && rateValue >= 0 && tenureValue > 0
    && [principalValue, rateValue, tenureValue].every(Number.isFinite)
    ? emiAuto(principalValue, rateValue, tenureValue)
    : null;
  const underTenure = calculated !== null && Number(emi) > 0 && Number(emi) * tenureValue < principalValue;

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
  const save = (values: LoanFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (loanId) actions.updateLoan(loanId, values);
      else actions.addLoan(values);
      const error = useAppStore.getState().lastError;
      if (error) void confirmAsync({ title: 'Could not save loan', message: error, confirmLabel: 'OK' });
      else router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!loan) return;
    const linkedCount = useAppStore.getState().data.transactions.filter((transaction) => transaction.source?.kind === 'loan-payment' && transaction.source.parentId === loan.id).length;
    void choiceAsync({
      title: 'Delete loan?',
      message: `This removes ${loan.payments.length} payments and affects ${linkedCount} linked transactions.`,
      choices: [
        { id: 'keep', label: 'Keep transactions' },
        { id: 'delete', label: 'Delete everything', destructive: true },
      ],
    }).then((choice) => {
      if (!choice) return;
      actions.deleteLoan(loan.id, { linkedTransactions: choice === 'keep' ? 'keep' : 'delete' });
      if (!useAppStore.getState().lastError) router.back();
    });
  };
  if (loanId && !loan) return <FormScreen title="Loan" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}><EmptyState title="Loan not found" /></FormScreen>;
  return (
    <FormScreen title={loan ? 'Edit loan' : 'New loan'} onClose={close} footer={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {loan ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
      <Button label="Save" variant="primary" disabled={isSubmitting || (submitCount > 0 && Object.keys(errors).length > 0)} onPress={() => {
        if (submitting.current) return;
        void handleSubmit(save)();
      }} />
    </View>}>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Name" accessibilityLabel="Loan name" maxLength={40} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />} />
      <Controller control={control} name="principal" render={({ field }) => <MoneyField label="Principal" accessibilityLabel="Loan principal" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.principal?.message} />} />
      <Controller control={control} name="ratePct" render={({ field }) => <PercentField label="Annual interest rate" accessibilityLabel="Annual interest rate" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.ratePct?.message} />} />
      <Controller control={control} name="tenureMonths" render={({ field }) => <IntegerField label="Tenure (months)" accessibilityLabel="Loan tenure in months" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.tenureMonths?.message} />} />
      <Controller control={control} name="startDate" render={({ field }) => <DateField value={field.value} onChange={field.onChange} maximumDate={today} error={errors.startDate?.message} accessibilityLabel="Loan start date" />} />
      <Controller control={control} name="emi" render={({ field }) => <MoneyField label="EMI (optional)" accessibilityLabel="Loan EMI" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.emi?.message} />} />
      {calculated !== null ? <View style={{ gap: 6 }}>
        <HelperText>Calculated EMI: {formatINR(calculated)}</HelperText>
        <Button label="Use this" onPress={() => setValue('emi', String(calculated), { shouldDirty: true, shouldValidate: true })} />
      </View> : null}
      {underTenure ? <HelperText tone="warning">This EMI won&apos;t repay the loan within the tenure</HelperText> : null}
    </FormScreen>
  );
}
