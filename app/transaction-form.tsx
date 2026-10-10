import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { AppText, Button, EmptyState } from '../src/components/ui';
import { ChoiceField } from '../src/components/form/ChoiceField';
import { DateField } from '../src/components/form/DateField';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { useAppActions } from '../src/data/useAppData';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { monthKey } from '../src/domain/dates';
import { describeSource } from '../src/domain/links';
import { makeTransactionFormSchema, TRANSACTION_CATEGORIES, type TransactionFormInput, type TransactionFormOutput } from '../src/domain/schemas';
import type { Transaction } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { confirmAsync } from '../src/lib/confirm';

const typeOptions = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Invest', value: 'invest' },
] as const;

export default function TransactionFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const actions = useAppActions();
  const setTxMonth = useUIStore((state) => state.setTxMonth);
  const { colors } = useTheme();
  const today = useMemo(() => todayISO(), []);
  const editing = transactionId !== undefined;
  const transaction = editing ? data.transactions.find((row) => row.id === transactionId) : undefined;
  const linkedSource = transaction?.source ? describeSource(data, transaction.source) : null;
  const submitting = useRef(false);
  const legacyCategories = useMemo(() => {
    const categories: readonly string[] = transaction ? TRANSACTION_CATEGORIES[transaction.type] : [];
    if (!transaction || categories.includes(transaction.category)) return {};
    return { [transaction.type]: [transaction.category] };
  }, [transaction]);
  const schema = useMemo(
    () => makeTransactionFormSchema(today, legacyCategories),
    [legacyCategories, today],
  );
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
    } : {
      amount: '',
      date: today,
      note: '',
      type: 'expense',
      category: TRANSACTION_CATEGORIES.expense[0],
    },
  });
  const selectedType = useWatch({ control, name: 'type' });

  const requestClose = () => {
    if (!isDirty) {
      router.back();
      return;
    }
    void confirmAsync({
      title: 'Discard changes?', message: 'Your changes have not been saved.',
      confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };

  const save = async (values: TransactionFormOutput) => {
    const input: Omit<Transaction, 'id'> = values;
    if (transactionId && transaction?.source) actions.updateTransaction(transactionId, { note: values.note });
    else if (transactionId) actions.updateTransaction(transactionId, input);
    else actions.addTransaction(input);

    const store = useAppStore.getState();
    if (store.lastError) {
      void confirmAsync({ title: 'Could not save transaction', message: store.lastError, confirmLabel: 'OK' });
      return;
    }
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
      .catch((error: unknown) => {
        void confirmAsync({
          title: 'Could not save transaction',
          message: error instanceof Error ? error.message : 'Please try again.',
          confirmLabel: 'OK',
        });
      })
      .finally(() => {
        submitting.current = false;
      });
  };

  const remove = () => {
    void confirmAsync({
      title: 'Delete transaction',
      message: "Delete this transaction? This can't be undone.",
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (!confirmed || !transactionId) return;
      actions.deleteTransaction(transactionId);
      const state = useAppStore.getState();
      if (state.lastError) void confirmAsync({ title: 'Could not delete transaction', message: state.lastError, confirmLabel: 'OK' });
      else router.back();
    });
  };

  if (editing && !transaction) {
    return (
      <FormScreen title="Transaction" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
        <EmptyState title="Transaction not found" subtitle="It may have been deleted. Return to your transactions to continue." />
      </FormScreen>
    );
  }

  const choices = [
    ...TRANSACTION_CATEGORIES[selectedType],
    ...(transaction?.type === selectedType && !(TRANSACTION_CATEGORIES[selectedType] as readonly string[]).includes(transaction.category)
      ? [transaction.category]
      : []),
  ];
  const errorCount = Object.keys(errors).length;
  const disabled = isSubmitting || (submitCount > 0 && errorCount > 0);

  return (
    <FormScreen
      title={transactionId ? 'Edit transaction' : 'Add transaction'}
      onClose={requestClose}
      footer={
        <View style={styles.footerActions}>
          {transactionId && !transaction?.source ? <Button label="Delete" variant="danger-text" onPress={remove} /> : null}
          {submitCount > 0 && errorCount > 0 ? (
            <View style={styles.errorSummary}>
              <AppText style={[typography.meta, { color: colors.err }]}>
                Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'}
              </AppText>
            </View>
          ) : null}
          <Button
            label="Save"
            variant="primary"
            disabled={disabled}
            accessibilityLabel="Save transaction"
            onPress={submitFromPress}
            style={styles.save}
          />
        </View>
      }>
      <>
          {transaction?.source ? (
            <>
              <ReadOnlyRow
                label="Linked transaction"
                value={`Linked to ${linkedSource?.label ?? 'another entry'}. Change amount, date or delete it from there.`}
              />
              {linkedSource ? (
                <Button
                  label={linkedSource.route === '/plan-logs'
                    ? 'Open plan logs'
                    : linkedSource.route === '/loan-payments' ? 'Open loan payments' : 'Open emergency fund'}
                  onPress={() => {
                    if (linkedSource.route === '/plan-logs') {
                      router.push({ pathname: '/plan-logs', params: linkedSource.params });
                    } else if (linkedSource.route === '/loan-payments') {
                      router.push({ pathname: '/loan-payments', params: linkedSource.params });
                    } else {
                      router.push('/emergency-fund');
                    }
                  }}
                />
              ) : null}
            </>
          ) : null}
          {transaction?.source ? (
            <>
              <ReadOnlyRow label="Type" value={transaction.type} />
              <ReadOnlyRow label="Amount" value={`₹${transaction.amount.toLocaleString('en-IN')}`} />
              <ReadOnlyRow label="Category" value={transaction.category} />
              <ReadOnlyRow label="Date" value={transaction.date} />
            </>
          ) : (
            <>
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
                      if (!(TRANSACTION_CATEGORIES[type] as readonly string[]).includes(category)) {
                        setValue('category', TRANSACTION_CATEGORIES[type][0], { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyField
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.amount?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <ChoiceField
                    label="Category"
                    value={field.value}
                    choices={choices}
                    onChange={field.onChange}
                    error={errors.category?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DateField
                    value={field.value}
                    onChange={field.onChange}
                    maximumDate={today}
                    error={errors.date?.message}
                  />
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
