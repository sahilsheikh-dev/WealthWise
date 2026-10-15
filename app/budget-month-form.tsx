import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, View } from 'react-native';

import { BudgetCategorySections } from '../src/components/form/BudgetCategorySections';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { RecurringItemsSummary } from '../src/components/form/RecurringItemsSummary';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { AppText, Button } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { BUDGET_CATEGORIES, BUDGET_GROUPS, monthlyCommitments, resolveTemplate } from '../src/domain/budget';
import { incomeBaselineFor } from '../src/domain/summary';
import { transactionCategoryLabel } from '../src/domain/transactions';
import { formatMonth } from '../src/lib/format';

type MonthForm = {
  plannedIncome: string;
  lines: { category: string; mode: 'amount' | 'percent'; planned: string }[];
};

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetMonthFormScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const month = typeof params.month === 'string' ? params.month : '';
  const data = useAppData();
  const actions = useAppActions();
  const stored = data.monthBudgets?.find((row) => row.month === month);
  const defaultTemplate = data.budgetTemplates?.find((row) => row.id === data.defaultBudgetTemplateId);
  const suggestedIncome = defaultTemplate?.plannedIncome ?? incomeBaselineFor(data, `${month}-01`)?.amount ?? null;
  const lastError = useAppStore((state) => state.lastError);
  const defaultValues = useMemo<MonthForm>(() => ({
    plannedIncome: stored?.plannedIncome !== undefined
      ? stored.plannedIncome === null ? '' : String(stored.plannedIncome)
      : suggestedIncome === null ? '' : String(suggestedIncome),
    lines: (() => {
      const templateLines = defaultTemplate && (!defaultTemplate.lines.some((line) => line.mode === 'percent') || suggestedIncome !== null)
        ? resolveTemplate(defaultTemplate, suggestedIncome)
        : [];
      const lineValues = new Map((stored?.lines ?? templateLines).map((line) => [line.category, line.planned]));
      return BUDGET_CATEGORIES.map((category) => ({
        category, mode: 'amount' as const,
        planned: lineValues.has(category) ? String(lineValues.get(category)) : '',
      }));
    })(),
  }), [defaultTemplate, stored, suggestedIncome]);
  const { control, handleSubmit, formState: { isDirty, isSubmitting } } = useForm<MonthForm>({ defaultValues });
  const lines = useWatch({ control, name: 'lines' }) ?? [];
  const plannedIncomeValue = useWatch({ control, name: 'plannedIncome' });
  const plannedIncome = Number(plannedIncomeValue);
  const commitments = useMemo(() =>
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? monthlyCommitments(data, month) : [],
  [data, month]);
  const submitting = useRef(false);
  const save = (values: MonthForm) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const plannedIncome = values.plannedIncome.trim() === '' ? null : Number(values.plannedIncome);
      const budgetLines = values.lines
        .filter((line) => line.planned.trim() !== '')
        .map((line) => ({
          category: line.category,
          planned: line.mode === 'percent' && plannedIncome !== null
            ? Math.round(Number(line.planned) * plannedIncome / 100)
            : Number(line.planned),
        }));
      if ((plannedIncome !== null && (!Number.isFinite(plannedIncome) || plannedIncome <= 0))
        || values.lines.some((line) => line.planned.trim() !== '' && line.mode === 'percent'
          && (plannedIncome === null || !Number.isFinite(Number(line.planned))
            || Number(line.planned) < 0 || Number(line.planned) > 100))
        || budgetLines.some((line) => !Number.isFinite(line.planned) || line.planned < 0)) {
        Alert.alert('Check your budget', 'Enter planned income for percentage lines and valid non-negative amounts or percentages up to 100%.');
        return;
      }
      actions.customizeMonthBudget(month, { plannedIncome, lines: budgetLines });
      const error = useAppStore.getState().lastError;
      if (error) Alert.alert('Could not save budget', error);
      else router.back();
    } finally {
      submitting.current = false;
    }
  };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return <FormScreen title="Monthly budget" onClose={() => router.back()} isDirty={false} footer={<Button label="Back" onPress={() => router.back()} />}>
      <FormErrorBanner message="Choose a valid month." />
    </FormScreen>;
  }
  return (
    <FormScreen title={`Budget · ${formatMonth(month)}`} onClose={() => router.back()} isDirty={isDirty} footer={(
      <Button label="Save budget" icon="save" variant="primary" disabled={isSubmitting} onPress={() => {
        if (!submitting.current) void handleSubmit(save)();
      }} />
    )}>
      <Controller control={control} name="plannedIncome" render={({ field }) => (
        <MoneyField label="Planned monthly income" accessibilityLabel="Planned monthly income" value={field.value}
          onChangeText={field.onChange} onBlur={field.onBlur} size="compact" />
      )} />
      <FormErrorBanner message={lastError} />
      {defaultTemplate?.lines.some((line) => line.mode === 'percent') && suggestedIncome === null
        ? <AppText>Add planned income to resolve percentage lines from the default template.</AppText>
        : null}
      <View style={{ gap: 14 }}>
        <RecurringItemsSummary items={commitments} />
        <BudgetCategorySections
          groups={BUDGET_GROUPS}
          summarizeGroup={(group) => {
            const amount = group.categories.reduce((total, category) => {
              const index = BUDGET_CATEGORIES.findIndex((item) => item === category);
              const line = lines[index];
              const value = Number(line?.planned) || 0;
              return total + (line?.mode === 'percent' ? value * plannedIncome / 100 : value);
            }, 0);
            return { amount, percent: plannedIncome > 0 ? amount / plannedIncome * 100 : 0 };
          }}
          renderCategory={(category) => {
            const index = BUDGET_CATEGORIES.findIndex((item) => item === category);
            return (
              <View key={category} style={{ gap: 6 }}>
                <Controller control={control} name={`lines.${index}.mode`} render={({ field }) => (
                  <SegmentedControl
                    value={field.value}
                    options={[
                      { label: 'Amount (₹)', value: 'amount' },
                      { label: '% of income', value: 'percent' },
                    ]}
                    size="compact"
                    onChange={field.onChange}
                  />
                )} />
                <Controller control={control} name={`lines.${index}.planned`} render={({ field }) => (
                  lines[index]?.mode === 'percent' ? (
                    <PercentField
                      label={transactionCategoryLabel(category)}
                      accessibilityLabel={`${transactionCategoryLabel(category)} percent of income`}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      size="compact"
                    />
                  ) : (
                    <MoneyField
                      label={transactionCategoryLabel(category)}
                      accessibilityLabel={`${transactionCategoryLabel(category)} planned amount`}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      size="compact"
                    />
                  )
                )} />
              </View>
            );
          }}
        />
        <AppText>{lines.filter((line) => Number(line?.planned) > 0).length} categories included</AppText>
      </View>
      {stored ? (
        <Button label="Clear this month’s budget" variant="danger-text" onPress={() => {
          actions.clearMonthBudget(month);
          const error = useAppStore.getState().lastError;
          if (error) Alert.alert('Could not clear budget', error);
          else router.back();
        }} />
      ) : null}
    </FormScreen>
  );
}
