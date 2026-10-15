import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { monthKey } from '../src/domain/dates';
import { efBalance } from '../src/domain/ef';
import { describeSource, investCategoryFor } from '../src/domain/links';
import { transactionCategoryLabel } from '../src/domain/transactions';
import { listInstruments } from '../src/domain/instruments';
import { holdingValue } from '../src/domain/portfolio';
import {
  makeTransactionFormSchema,
  INVESTMENT_FORM_CATEGORIES,
  TRANSACTION_CATEGORIES,
  type TransactionFormInput,
  type TransactionFormOutput,
} from '../src/domain/schemas';
import type { Transaction } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { formatAmount } from '../src/lib/amountDisplay';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const typeOptions = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Invest', value: 'invest' },
] as const;
const createInvestmentChoice = '__create-investment__';
const noInvestmentChoice = '__no-investment__';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function TransactionFormScreen() {
  const { id, type: initialTypeParam } = useLocalSearchParams<{ id?: string; type?: string }>();
  const transactionId = Array.isArray(id) ? id[0] : id;
  const initialTypeValue = Array.isArray(initialTypeParam) ? initialTypeParam[0] : initialTypeParam;
  const initialType: Transaction['type'] = initialTypeValue === 'income' || initialTypeValue === 'invest'
    ? initialTypeValue
    : 'expense';
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const lastCreatedInstrumentId = useUIStore((state) => state.lastCreatedInstrumentId);
  const setLastCreatedInstrumentId = useUIStore((state) => state.setLastCreatedInstrumentId);
  const { colors } = useTheme();
  const today = useMemo(() => todayISO(), []);
  const editing = transactionId !== undefined;
  const transaction = editing ? data.transactions.find((row) => row.id === transactionId) : undefined;
  const linkedSource = transaction?.source ? describeSource(data, transaction.source) : null;
  const linkedInstrument = transaction?.source?.kind === 'holding-entry' || transaction?.source?.kind === 'ef-entry';
  const instruments = useMemo(() => listInstruments(data, today), [data, today]);
  const legacyCategories = useMemo(() => {
    const categories: readonly string[] = transaction ? TRANSACTION_CATEGORIES[transaction.type] : [];
    if (!transaction || categories.includes(transaction.category)) return {};
    return { [transaction.type]: [transaction.category] };
  }, [transaction]);
  const mode = !editing
    ? 'create'
    : linkedInstrument ? 'edit-linked' : 'edit-unlinked';
  const withdrawable = useMemo(() => {
    const values: Record<string, number> = Object.fromEntries(
      instruments.map((item) => [item.id, item.valueNow]),
    );
    if (transaction?.type === 'income' && transaction.source?.kind === 'holding-entry') {
      const holding = data.holdings.find((item) => item.id === transaction.source?.parentId);
      if (holding) {
        values[holding.id] = holdingValue({
          ...holding,
          logs: holding.logs.filter((entry) => entry.id !== transaction.source?.entryId),
        }, today);
      }
    } else if (transaction?.type === 'income' && transaction.source?.kind === 'ef-entry') {
      values.ef = efBalance(data.efEntries.filter((entry) => entry.id !== transaction.source?.entryId));
    }
    return values;
  }, [data.efEntries, data.holdings, instruments, today, transaction]);
  const schema = useMemo(
    () => makeTransactionFormSchema(today, legacyCategories, {
      instruments,
      withdrawable,
      mode,
    }),
    [instruments, legacyCategories, mode, today, withdrawable],
  );
  const submitting = useRef(false);
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<TransactionFormInput, undefined, TransactionFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: transaction ? {
      amount: String(transaction.amount),
      date: transaction.date,
      note: transaction.note,
      type: transaction.type,
      category: transaction.category,
      instrumentId: transaction.source?.kind === 'holding-entry'
        ? transaction.source.parentId
        : transaction.source?.kind === 'ef-entry' ? 'ef' : undefined,
    } : {
      amount: '',
      date: today,
      note: '',
      type: initialType,
      category: TRANSACTION_CATEGORIES[initialType][0],
      instrumentId: undefined,
    },
  });
  const selectedType = useWatch({ control, name: 'type' });
  const selectedCategory = useWatch({ control, name: 'category' });
  const selectedInstrumentId = useWatch({ control, name: 'instrumentId' });

  useEffect(() => {
    if (!lastCreatedInstrumentId) return;
    setValue('instrumentId', lastCreatedInstrumentId, { shouldDirty: true, shouldValidate: true });
    if (getValues('type') === 'invest') {
      const selected = instruments.find((item) => item.id === lastCreatedInstrumentId);
      if (selected) setValue('category', selected.id === 'ef' ? 'Emergency fund' : investCategoryFor(selected.type as Exclude<typeof selected.type, 'Emergency fund'>), { shouldDirty: true });
    }
    setLastCreatedInstrumentId(null);
  }, [getValues, instruments, lastCreatedInstrumentId, setLastCreatedInstrumentId, setValue]);

  const selectedInstrument = instruments.find((item) => item.id === selectedInstrumentId);
  const isWithdrawalForm = selectedType === 'income' && selectedCategory === 'Withdrawal';
  const linkedEditable = linkedInstrument && transaction?.source !== undefined;
  const standardCategories = selectedType === 'invest'
    ? INVESTMENT_FORM_CATEGORIES
    : TRANSACTION_CATEGORIES[selectedType];
  const choices = [
    ...standardCategories,
    ...(transaction?.type === selectedType && !(standardCategories as readonly string[]).includes(transaction.category)
      ? [transaction.category]
      : []),
  ];
  const instrumentChoices = [
    ...instruments.map((item) => item.id),
    ...(!editing || (transaction?.type === 'invest' && !transaction.source) ? [createInvestmentChoice] : []),
    ...(transaction?.type === 'invest' && !transaction.source ? [noInvestmentChoice] : []),
  ];
  const instrumentLabels = Object.fromEntries([
    ...instruments.map((item) => [item.id, item.id === 'ef' ? item.name : `${item.name} (${item.type})`]),
    [createInvestmentChoice, '+ Create new investment'],
    [noInvestmentChoice, 'Not linked'],
  ]);
  const withdrawalChoices = instruments.filter((item) => (withdrawable[item.id] ?? 0) > 0).map((item) => item.id);
  const withdrawalLabels = Object.fromEntries(instruments.map((item) => [
    item.id,
    `${item.name} · ${formatAmount(withdrawable[item.id] ?? item.valueNow, 'exact', 1)}`,
  ]));
  const derivedCategory = selectedInstrument
    ? selectedInstrument.id === 'ef'
      ? 'Emergency fund'
      : investCategoryFor(selectedInstrument.type as Exclude<typeof selectedInstrument.type, 'Emergency fund'>)
    : transaction?.category ?? '';

  const save = async (values: TransactionFormOutput) => {
    const { instrumentId, ...transactionValues } = values;
    const input: Omit<Transaction, 'id'> = transactionValues;
    if (transactionId && linkedEditable) {
      actions.updateLinkedTransaction(transactionId, {
        amount: values.amount,
        date: values.date,
        note: values.note,
        ...(instrumentId ? { instrumentId } : {}),
      });
    } else if (transactionId && transaction?.source) {
      actions.updateTransaction(transactionId, { note: values.note });
    } else if (transactionId && transaction?.type === 'invest' && instrumentId) {
      actions.linkExistingTransaction(transactionId, instrumentId, values.note);
    } else if (transactionId) {
      actions.updateTransaction(transactionId, input);
    } else if (instrumentId && (values.type === 'invest' || values.type === 'income' && values.category === 'Withdrawal')) {
      actions.addInstrumentTransaction({
        kind: values.type === 'invest' ? 'deposit' : 'withdrawal',
        instrumentId,
        amount: values.amount,
        date: values.date,
        note: values.note,
      });
    } else {
      actions.addTransaction(input);
    }

    const store = useAppStore.getState();
    if (store.lastError) return;
    const saved = transactionId
      ? store.data.transactions.find((row) => row.id === transactionId)
      : store.data.transactions.at(-1);
    if (!saved) return;
    setTxMonth(monthKey(saved.date));
    router.back();
  };

  const submitFromPress = () => {
    if (submitting.current) return;
    submitting.current = true;
    void handleSubmit(save)()
      .finally(() => { submitting.current = false; });
  };

  const remove = () => {
    if (!transactionId || !transaction) return;
    const linkedName = linkedSource?.label;
    void confirmAsync({
      title: 'Delete transaction',
      message: linkedEditable
        ? `This also removes the entry from ${linkedName ?? 'the investment'}.`
        : "Delete this transaction? This can't be undone.",
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      if (linkedEditable) actions.deleteLinkedTransaction(transactionId);
      else actions.deleteTransaction(transactionId);
      if (!useAppStore.getState().lastError) router.back();
    });
  };

  if (editing && !transaction) {
    return (
      <FormScreen title="Transaction" onClose={() => router.back()} isDirty={false} footer={<Button label="Back" onPress={() => router.back()} />}>
        <EmptyState title="Transaction not found" subtitle="It may have been deleted. Return to your transactions to continue." />
      </FormScreen>
    );
  }

  const errorCount = Object.keys(errors).length;
  const disabled = isSubmitting || (submitCount > 0 && errorCount > 0);
  const showInstrumentPicker = !transaction && isWithdrawalForm;
  const effectiveInstrumentChoices = isWithdrawalForm ? withdrawalChoices : instrumentChoices;
  const effectiveInstrumentLabels = isWithdrawalForm ? withdrawalLabels : instrumentLabels;

  return (
    <FormScreen
      title="Transaction"
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={transactionId && (!transaction?.source || linkedEditable)
        ? { label: 'Delete transaction', onPress: remove }
        : undefined}
      footer={
        <View style={styles.footerActions}>
          {submitCount > 0 && errorCount > 0 ? (
            <View style={styles.errorSummary}>
              <AppText style={[typography.meta, { color: colors.err }]}>
                Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'}
              </AppText>
            </View>
          ) : null}
          <Button
            label="Save"
            icon="save"
            variant="primary"
            disabled={disabled}
            accessibilityLabel="Save transaction"
            onPress={submitFromPress}
            style={styles.save}
          />
        </View>
      }>
      <>
        <FormErrorBanner message={lastError} />
        {transaction?.source ? (
          <>
            <ReadOnlyRow
              label="Linked transaction"
              value={linkedEditable
                ? 'Type and category are determined by the linked investment entry.'
                : `Linked to ${linkedSource?.label ?? 'another entry'}. Change it from there.`}
            />
            {linkedSource ? (
              <Button
                label={linkedSource.route === '/investment-entries'
                  ? 'Open investment entries'
                  : linkedSource.route === '/liability-payments' ? 'Open liability payments' : 'Open emergency fund'}
                onPress={() => {
                  if (linkedSource.route === '/investment-entries') {
                    router.push(`/investment-entries?id=${encodeURIComponent(linkedSource.params.id ?? '')}` as Href);
                  } else if (linkedSource.route === '/liability-payments') {
                    router.push({ pathname: '/liability-payments', params: linkedSource.params });
                  } else {
                    router.push('/emergency-fund');
                  }
                }}
              />
            ) : null}
          </>
        ) : null}
        {transaction?.source && !linkedEditable ? (
          <>
            <ReadOnlyRow label="Type" value={transaction.type} />
            <ReadOnlyRow label="Amount" value={formatAmount(transaction.amount, 'exact', 1)} />
            <ReadOnlyRow label="Category" value={transactionCategoryLabel(linkedEditable ? derivedCategory : transaction.category, transaction.type)} />
            <ReadOnlyRow label="Date" value={transaction.date} />
          </>
        ) : (
          <>
            {!transaction?.source ? (
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <SegmentedControl
                    label="Type"
                    value={field.value}
                    options={typeOptions}
                    error={errors.type?.message}
                    onChange={(type) => {
                      const category = getValues('category');
                      field.onChange(type);
                      if (type !== 'invest') setValue('instrumentId', undefined, { shouldDirty: true, shouldValidate: true });
                      const categories = type === 'invest' ? INVESTMENT_FORM_CATEGORIES : TRANSACTION_CATEGORIES[type];
                      if (!(categories as readonly string[]).includes(category)) {
                        setValue('category', categories[0], { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                  />
                )}
              />
            ) : (
              <>
                <ReadOnlyRow label="Type" value={transaction.type} />
                <ReadOnlyRow label="Category" value={transactionCategoryLabel(transaction.category, transaction.type)} />
              </>
            )}
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyField value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />
              )}
            />
            {!transaction?.source && selectedType === 'invest' ? (
              <>
                <Controller
                  control={control}
                  name="instrumentId"
                  render={({ field }) => (
                    <ChoiceField
                      label={transaction ? 'Link to an investment (optional)' : 'Invest in'}
                      value={field.value ?? ''}
                      choices={effectiveInstrumentChoices}
                      choiceLabels={effectiveInstrumentLabels}
                      onChange={(id) => {
                        if (id === createInvestmentChoice) {
                          router.push({ pathname: '/investment-form', params: { fromTransaction: '1' } });
                          return;
                        }
                        if (id === noInvestmentChoice) {
                          field.onChange(undefined);
                          return;
                        }
                        field.onChange(id || undefined);
                        const item = instruments.find((instrument) => instrument.id === id);
                        if (item) setValue('category', item.id === 'ef' ? 'Emergency fund' : investCategoryFor(item.type as Exclude<typeof item.type, 'Emergency fund'>), { shouldDirty: true, shouldValidate: true });
                      }}
                      error={errors.instrumentId?.message}
                    />
                  )}
                />
                <ReadOnlyRow label="Category" value={selectedInstrument ? derivedCategory : transaction?.category ?? 'Choose an investment'} />
              </>
            ) : null}
            {!transaction?.source && selectedType !== 'invest' ? (
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <ChoiceField
                    label="Category"
                    value={field.value}
                    choices={choices}
                    choiceLabels={Object.fromEntries(choices.map((category) => [category, transactionCategoryLabel(category, selectedType)]))}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value !== 'Withdrawal') setValue('instrumentId', undefined, { shouldDirty: true, shouldValidate: true });
                    }}
                    error={errors.category?.message}
                  />
                )}
              />
            ) : null}
            {showInstrumentPicker || linkedEditable ? (
              <Controller
                control={control}
                name="instrumentId"
                render={({ field }) => (
                  <ChoiceField
                    label={isWithdrawalForm ? 'Withdraw from' : transaction ? 'Move to investment' : 'Invest in'}
                    value={field.value ?? ''}
                    choices={effectiveInstrumentChoices}
                    choiceLabels={effectiveInstrumentLabels}
                    onChange={(value) => {
                      field.onChange(value);
                      const item = instruments.find((candidate) => candidate.id === value);
                      if (selectedType === 'invest' && item) {
                        setValue('category', item.id === 'ef' ? 'Emergency fund' : investCategoryFor(item.type as Exclude<typeof item.type, 'Emergency fund'>), { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                    error={errors.instrumentId?.message}
                  />
                )}
              />
            ) : null}
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField value={field.value} onChange={field.onChange} maximumDate={today} error={errors.date?.message} />
              )}
            />
          </>
        )}
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextField
              label="Note (optional)"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Add a note"
              accessibilityLabel="Transaction note"
              maxLength={61}
              error={errors.note?.message}
            />
          )}
        />
      </>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footerActions: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorSummary: { flex: 1, alignItems: 'center' },
  save: { flex: 1 },
});
