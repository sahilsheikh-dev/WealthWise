import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, View } from 'react-native';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { monthlyCommitments, suggestTemplate } from '../src/domain/budget';
import { BUDGET_CATEGORIES } from '../src/domain/schemas';
import type { BudgetTemplateLine } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { incomeBaselineFor } from '../src/domain/summary';
import { formatINR } from '../src/lib/format';

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
  const { control, handleSubmit, setValue, formState: { isSubmitting } } = useForm<TemplateForm>({ defaultValues: defaults });
  const watched = useWatch({ control });
  const percentTotal = watched.lines?.reduce((sum, line) =>
    sum + (line?.mode === 'percent' ? Number(line.value) || 0 : 0), 0) ?? 0;
  const [suggestMode, setSuggestMode] = useState<'503020' | 'blank'>('503020');
  const [warnings, setWarnings] = useState<string[]>([]);
  const submitting = useRef(false);
  const setUpSuggested = () => {
    const plannedIncome = Number(watched.plannedIncome);
    if (!Number.isFinite(plannedIncome) || plannedIncome <= 0) {
      Alert.alert('Add monthly income', 'Enter planned income before generating a 50/30/20 suggestion.');
      return;
    }
    if (suggestMode === 'blank') {
      setValue('lines', BUDGET_CATEGORIES.map((category) => ({ category, mode: 'amount', value: '' })));
      setWarnings([]);
      return;
    }
    const suggestion = suggestTemplate({ plannedIncome, commitments: monthlyCommitments(data, month) });
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
    return <FormScreen title="Budget template" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <FormErrorBanner message="Budget template not found." />
    </FormScreen>;
  }

  return (
    <FormScreen title={saveAsTemplate ? 'Save month as template' : template ? 'Edit template' : 'Set up your budget'}
      onClose={() => router.back()} footer={(
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
          value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
      )} />
      {isWizard && !template ? (
        <>
          <AppText style={{ opacity: 0.8 }}>
            {incomeBaseline === null ? 'Enter your monthly income to start.' : `Suggested from your income history: ${formatINR(incomeBaseline)}`}
          </AppText>
          <SegmentedControl
            label="Starting point"
            value={suggestMode}
            options={[
              { label: '50/30/20', value: '503020' },
              { label: 'Blank', value: 'blank' },
            ]}
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
        {BUDGET_CATEGORIES.map((category, index) => (
          <View key={category} style={{ gap: 8 }}>
            <AppText weight="semibold">{category}</AppText>
            <Controller control={control} name={`lines.${index}.mode`} render={({ field }) => (
              <SegmentedControl
                label="Line type"
                value={field.value}
                options={[
                  { label: 'Amount', value: 'amount' },
                  { label: '% income', value: 'percent' },
                ]}
                onChange={field.onChange}
              />
            )} />
            <Controller control={control} name={`lines.${index}.value`} render={({ field }) => (
              watched.lines?.[index]?.mode === 'percent' ? (
                <TextField label="Percent of income" accessibilityLabel={`${category} percent of income`}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              ) : (
                <MoneyField label="Planned amount" accessibilityLabel={`${category} planned amount`}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )
            )} />
          </View>
        ))}
      </View>
    </FormScreen>
  );
}
