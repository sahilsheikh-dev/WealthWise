import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { addMonths } from '../src/domain/dates';
import { loanState } from '../src/domain/liability';
import {
  makeLiabilityClosureFormSchema,
  type LiabilityClosureFormInput,
  type LiabilityClosureFormOutput,
} from '../src/domain/schemas';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function LiabilityClosureFormScreen() {
  const params = useLocalSearchParams<{ liabilityId?: string }>();
  const liabilityId = Array.isArray(params.liabilityId) ? params.liabilityId[0] : params.liabilityId;
  const liability = useAppStore((state) => state.data.liabilities.find((entry) => entry.id === liabilityId));
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const firstPaymentDate = liability?.kind === 'recurring' ? addMonths(liability.startDate, 1) : today;
  const form = useForm<LiabilityClosureFormInput, undefined, LiabilityClosureFormOutput>({
    resolver: zodResolver(makeLiabilityClosureFormSchema(today, firstPaymentDate)),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      date: today,
      amountPaid: String(liability?.kind === 'recurring' ? loanState(liability, today).balance : ''),
      note: '',
    },
  });
  const { control, handleSubmit, setValue, formState: { errors, isDirty, isSubmitting } } = form;
  const date = useWatch({ control, name: 'date' }) || today;
  const outstanding = liability?.kind === 'recurring'
    ? loanState(liability, date).balance
    : 0;
  const submitting = useRef(false);

  const close = async (values: LiabilityClosureFormOutput) => {
    if (!liability || liability.kind !== 'recurring' || submitting.current) return;
    const balance = loanState(liability, values.date).balance;
    const difference = values.amountPaid - balance;
    const differenceLabel = difference > 0
      ? `Overpayment (separate closure charges): ${formatAmount(difference, 'exact', 2)}`
      : difference < 0
        ? `Amount written off: ${formatAmount(Math.abs(difference), 'exact', 2)}`
        : 'Difference: none';
    const confirmed = await confirmAsync({
      title: 'Confirm loan closure?',
      message: `Outstanding on ${values.date}: ${formatAmount(balance, 'exact', 2)}\nAmount paid: ${formatAmount(values.amountPaid, 'exact', 2)}\n${differenceLabel}`,
      confirmLabel: 'Continue',
    });
    if (!confirmed) return;
    let writeOffConfirmed = false;
    if (values.amountPaid < balance) {
      writeOffConfirmed = await confirmAsync({
        title: 'Lender closed the loan for less',
        message: `The remaining ${formatAmount(balance - values.amountPaid, 'exact', 2)} will be written off and the loan marked closed.`,
        confirmLabel: 'Write off and close',
        destructive: true,
      });
      if (!writeOffConfirmed) return;
    }

    submitting.current = true;
    try {
      actions.closeLiabilityEarly(liability.id, {
        date: values.date,
        amountPaid: values.amountPaid,
        note: values.note,
        writeOffConfirmed,
      });
      const error = useAppStore.getState().lastError;
      if (error) {
        void confirmAsync({ title: 'Could not close loan', message: error, confirmLabel: 'OK' });
      } else {
        router.back();
      }
    } finally {
      submitting.current = false;
    }
  };

  if (!liability || liability.kind !== 'recurring' || liability.closure) {
    return (
      <FormScreen title="Foreclosure" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Open recurring liability not found" />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Foreclosure"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={(
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button
            label="Close loan"
            icon="check"
            variant="primary"
            style={{ flex: 1 }}
            disabled={isSubmitting || Object.keys(errors).length > 0}
            onPress={() => {
              if (!submitting.current) void handleSubmit(close)();
            }}
          />
        </View>
      )}
    >
      <DateField
        label="Closure date"
        value={date}
        onChange={(next) => {
          setValue('date', next, { shouldDirty: true, shouldValidate: true });
          setValue('amountPaid', String(loanState(liability, next).balance), { shouldDirty: true, shouldValidate: true });
        }}
        maximumDate={today}
        error={errors.date?.message}
        accessibilityLabel="Loan closure date"
      />
      <Controller control={control} name="amountPaid" render={({ field }) => (
        <MoneyField
          label="Amount paid to lender"
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={errors.amountPaid?.message}
          accessibilityLabel="Amount paid to lender"
        />
      )} />
      <Controller control={control} name="note" render={({ field }) => (
        <TextField
          label="Note (optional)"
          accessibilityLabel="Loan closure note"
          maxLength={200}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={errors.note?.message}
        />
      )} />
      <ReadOnlyRow label="Outstanding on this date" value={formatAmount(outstanding, 'exact', 2)} />
    </FormScreen>
  );
}
