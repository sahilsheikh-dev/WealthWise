import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, View } from 'react-native';

import { BudgetCategorySections } from '../src/components/form/BudgetCategorySections';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { RecurringItemsSummary } from '../src/components/form/RecurringItemsSummary';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { BUDGET_CATEGORIES, BUDGET_GROUPS, monthlyCommitments, suggestTemplate } from '../src/domain/budget';
import { incomeBaselineFor } from '../src/domain/summary';
import { transactionCategoryLabel } from '../src/domain/transactions';
import type { BudgetTemplateLine } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';

type TemplateForm = {
  name: string;
  plannedIncome: string;
  applyToMonth: boolean;
  lines: { category: string; mode: BudgetTemplateLine['mode']; value: string }[];
};

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetTemplateFormScreen() {
  const params = useLocalSearchParams<{ id?: string; wizard?: string; month?: string; saveAsTemplate?: string }>();
  const templateId = typeof params.id === 'string' ? params.id : undefined;
  const month = typeof params.month === 'string' ? params.month : todayISO().slice(0, 7);
  const isWizard = params.wizard === '1';
  const saveAsTemplate = params.saveAsTemplate === '1';
  const data = useAppData();
  const actions = useAppActions();
  const today = todayISO();
  const template = data.budgetTemplates?.find((item) => item.id === templateId);
  const storedMonth = data.monthBudgets?.find((row) => row.month === month);
  const incomeBaseline = incomeBaselineFor(data, today)?.amount ?? null;
  const commitments = useMemo(() =>
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? monthlyCommitments(data, month) : [],
  [data, month]);
  const defaults = useMemo<TemplateForm>(() => {
    const savedLines = template?.lines ?? (storedMonth?.lines ?? []).map((line) => ({
      category: line.category, mode: 'amount' as const, value: line.planned,
    }));
    const values = new Map(savedLines.map((line) => [line.category, line]));
    return {
      name: saveAsTemplate ? `${month} budget` : template?.name ?? '',
      plannedIncome: template?.plannedIncome !== undefined
        ? template.plannedIncome === null ? '' : String(template.plannedIncome)
        : storedMonth?.plannedIncome === null || storedMonth?.plannedIncome === undefined
          ? incomeBaseline === null ? '' : String(incomeBaseline)
          : String(storedMonth.plannedIncome),
      applyToMonth: false,
      lines: BUDGET_CATEGORIES.map((category) => {
        const line = values.get(category);
        return { category, mode: line?.mode ?? 'amount', value: line ? String(line.value) : '' };
      }),
    };
  }, [incomeBaseline, month, saveAsTemplate, storedMonth, template]);
  const { control, handleSubmit, setValue, formState: { isDirty, isSubmitting } } = useForm<TemplateForm>({ defaultValues: defaults });
  const watched = useWatch({ control });
  const percentTotal = watched.lines?.reduce((sum, line) =>
    sum + (line?.mode === 'percent' ? Number(line.value) || 0 : 0), 0) ?? 0;
  const [suggestMode, setSuggestMode] = useState<'five-group' | 'blank'>('five-group');
  const [warnings, setWarnings] = useState<string[]>([]);
  const submitting = useRef(false);
  const setUpSuggested = () => {
    const plannedIncome = Number(watched.plannedIncome);
    if (!Number.isFinite(plannedIncome) || plannedIncome <= 0) {
      Alert.alert('Add monthly income', 'Enter planned income before generating a five-group suggestion.');
      return;
    }
    if (suggestMode === 'blank') {
      setValue('lines', BUDGET_CATEGORIES.map((category) => ({ category, mode: 'amount', value: '' })));
      setWarnings([]);
      return;
    }
    const suggestion = suggestTemplate({ plannedIncome, commitments });
    setValue('lines', BUDGET_CATEGORIES.map((category) => ({
      category,
      mode: 'amount',
      value: String(suggestion.lines.find((line) => line.category === category)?.planned ?? ''),
    })));
    setWarnings(suggestion.warnings);
  };

  const save = (values: TemplateForm) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const plannedIncome = values.plannedIncome.trim() ? Number(values.plannedIncome) : null;
      const lines = values.lines.filter((line) => line.value.trim() !== '').map((line) => ({
        category: line.category,
        mode: line.mode,
        value: Number(line.value),
      }));
      if (!values.name.trim() || values.name.trim().length > 40
        || (plannedIncome !== null && (!Number.isFinite(plannedIncome) || plannedIncome <= 0))
        || lines.some((line) => !Number.isFinite(line.value) || line.value < 0
          || (line.mode === 'percent' && line.value > 100))) {
        Alert.alert('Check your template', 'Enter a name, a positive planned income when provided, and valid budget line values.');
        return;
      }
      if (lines.some((line) => line.mode === 'percent') && plannedIncome === null) {
        Alert.alert('Planned income required', 'Enter planned income to use percentage-based budget lines.');
        return;
      }
      if (saveAsTemplate) {
        actions.saveMonthAsTemplate(month, values.name.trim());
      } else if (template) {
        actions.updateBudgetTemplate(template.id, {
          name: values.name.trim(), plannedIncome, lines,
        });
      } else if (values.applyToMonth) {
        actions.createBudgetTemplateAndApply({
          name: values.name.trim(), plannedIncome, lines,
        }, month);
      } else {
        actions.createBudgetTemplate({
          name: values.name.trim(), plannedIncome, lines,
        });
      }
      const error = useAppStore.getState().lastError;
      if (error) Alert.alert('Could not save template', error);
      else router.back();
    } finally {
      submitting.current = false;
    }
  };
  if (templateId && !template) {
    return <FormScreen title="Budget template" onClose={() => router.back()} isDirty={false} footer={<Button label="Back" onPress={() => router.back()} />}>
      <FormErrorBanner message="Budget template not found." />
    </FormScreen>;
  }

  return (
    <FormScreen title={saveAsTemplate ? 'Save month as template' : template ? 'Edit template' : 'Set up your budget'}
      onClose={() => router.back()} isDirty={isDirty} footer={(
        <Button label="Save template" icon="save" variant="primary" disabled={isSubmitting} onPress={() => {
          if (!submitting.current) void handleSubmit(save)();
        }} />
      )}>
      <Controller control={control} name="name" render={({ field }) => (
        <TextField label="Template name" accessibilityLabel="Budget template name" maxLength={40}
          value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
      )} />
      <Controller control={control} name="plannedIncome" render={({ field }) => (
        <MoneyField label="Planned monthly income" accessibilityLabel="Planned monthly income"
          value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} size="compact" />
      )} />
      {isWizard && !template ? (
        <>
          <AppText style={{ opacity: 0.8 }}>
            {incomeBaseline === null ? 'Enter your monthly income to start.' : `Suggested from your income history: ${formatAmount(incomeBaseline, 'exact', 1)}`}
          </AppText>
          <AppText weight="semibold">Starting point</AppText>
          <SegmentedControl
            value={suggestMode}
            options={[
              { label: 'Five-group plan (recommended)', value: 'five-group' },
              { label: 'Start blank', value: 'blank' },
            ]}
            size="compact"
            onChange={setSuggestMode}
          />
          <Button label="Review suggested lines" onPress={setUpSuggested} />
          {warnings.map((warning) => <AppText key={warning}>{warning}</AppText>)}
        </>
      ) : null}
      <Controller control={control} name="applyToMonth" render={({ field }) => (
        !template && !saveAsTemplate ? (
          <SwitchRow label={`Apply to ${month}`} value={field.value} onValueChange={field.onChange} />
        ) : <View />
      )} />
      {saveAsTemplate ? <AppText>Saving preserves this month’s planned amounts as a reusable template.</AppText> : null}
      <View style={{ gap: 12 }}>
        <AppText>Total: {percentTotal.toFixed(1)}% of income</AppText>
        <AppText weight="semibold">Set up your budget inputs</AppText>
        <RecurringItemsSummary items={commitments} />
        <BudgetCategorySections
          groups={BUDGET_GROUPS}
          summarizeGroup={(group) => {
            const plannedIncome = Number(watched.plannedIncome);
            const amount = group.categories.reduce((total, category) => {
              const index = BUDGET_CATEGORIES.findIndex((item) => item === category);
              const line = watched.lines?.[index];
              const value = Number(line?.value) || 0;
              return total + (line?.mode === 'percent' ? value * (Number.isFinite(plannedIncome) ? plannedIncome : 0) / 100 : value);
            }, 0);
            return { amount, percent: plannedIncome > 0 ? amount / plannedIncome * 100 : 0 };
          }}
          renderCategory={(category) => {
            const index = BUDGET_CATEGORIES.findIndex((item) => item === category);
            const displayCategory = transactionCategoryLabel(category);
            return (
              <View key={category} style={{ gap: 8 }}>
                <AppText weight="semibold">{displayCategory}</AppText>
                <Controller control={control} name={`lines.${index}.mode`} render={({ field }) => (
                  <SegmentedControl
                    label="Enter as"
                    value={field.value}
                    options={[
                      { label: 'Amount (₹)', value: 'amount' },
                      { label: '% of income', value: 'percent' },
                    ]}
                    size="compact"
                    onChange={field.onChange}
                  />
                )} />
                <Controller control={control} name={`lines.${index}.value`} render={({ field }) => (
                  watched.lines?.[index]?.mode === 'percent' ? (
                    <PercentField label="Percent of income" accessibilityLabel={`${displayCategory} percent of income`}
                      value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} size="compact" />
                  ) : (
                    <MoneyField label="Planned amount" accessibilityLabel={`${displayCategory} planned amount`}
                      value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} size="compact" />
                  )
                )} />
              </View>
            );
          }}
        />
      </View>
    </FormScreen>
  );
}
