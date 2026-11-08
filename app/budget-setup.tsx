import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Switch, View } from 'react-native';

import { BudgetCategorySections } from '../src/components/form/BudgetCategorySections';
import { ChoiceField } from '../src/components/form/ChoiceField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { PercentField } from '../src/components/form/PercentField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions, useAppData } from '../src/data/useAppData';
import {
  BUDGET_CATEGORIES,
  BUDGET_GROUPS,
  linkedRecurringForMonth,
  monthlyCommitments,
  suggestBudgetSplit,
} from '../src/domain/budget';
import { shiftMonth } from '../src/domain/dates';
import { pendingItems } from '../src/domain/pending';
import { EARNED_INCOME_CATEGORIES, type BudgetIncomeItem, type BudgetPlanLine, type EarnedIncomeCategory } from '../src/domain/types';
import { confirmAsync } from '../src/lib/confirm';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatMonth } from '../src/lib/format';

type SetupLine = {
  category: string;
  mode: 'amount' | 'percent';
  value: string;
  dueDay: string;
};

type SetupForm = {
  incomes: { id: string; name: string; category: string; amount: string; day: string }[];
  lines: SetupLine[];
};

function isEarnedIncomeCategory(value: string): value is EarnedIncomeCategory {
  return EARNED_INCOME_CATEGORIES.some((category) => category === value);
}

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetSetupScreen() {
  const data = useAppData();
  const actions = useAppActions();
  const today = todayISO();
  const month = today.slice(0, 7);
  const lastError = useAppStore((state) => state.lastError);
  const setActionToast = useUIStore((state) => state.setActionToast);
  const [repeatMonthly, setRepeatMonthly] = useState(data.budgetPlan?.repeatMonthly ?? false);
  const submitting = useRef(false);
  const linkedRows = useMemo(() => linkedRecurringForMonth(data, month, today), [data, month, today]);
  const defaultValues = useMemo<SetupForm>(() => {
    const plan = data.budgetPlan;
    const byCategory = new Map((plan?.lines ?? []).map((line) => [line.category, line]));
    return {
      incomes: (plan?.incomes ?? []).map((income) => ({
        id: income.id,
        name: income.name,
        category: income.category,
        amount: String(income.amount),
        day: income.day === undefined ? '' : String(income.day),
      })),
      lines: BUDGET_CATEGORIES.map((category) => {
        const line = byCategory.get(category);
        return {
          category,
          mode: line?.mode ?? 'amount',
          value: line ? String(line.value) : '',
          dueDay: line?.dueDay === undefined ? '' : String(line.dueDay),
        };
      }),
    };
  }, [data.budgetPlan]);
  const { control, handleSubmit, formState: { isDirty, isSubmitting }, setValue } = useForm<SetupForm>({
    defaultValues,
  });
  const lines = useWatch({ control, name: 'lines' }) ?? [];
  const incomes = useWatch({ control, name: 'incomes' }) ?? [];
  const plannedIncome = incomes.length === 0
    ? null
    : incomes.reduce((sum, income) => sum + (Number(income.amount) || 0), 0);

  const planFromValues = (values: SetupForm) => {
    const incomeItems: BudgetIncomeItem[] = values.incomes.map((income) => ({
      id: income.id,
      name: income.name.trim(),
      category: isEarnedIncomeCategory(income.category) ? income.category : 'Other',
      amount: Number(income.amount),
      ...(income.day.trim() === '' ? {} : { day: Number(income.day) }),
    }));
    const planLines: BudgetPlanLine[] = values.lines.flatMap((line) => {
      if (line.category === 'EMI' || line.category === 'Insurance' || line.value.trim() === '') return [];
      const value = Number(line.value);
      return [{
        category: line.category,
        mode: line.mode,
        value,
        ...(line.dueDay.trim() !== '' ? { dueDay: Number(line.dueDay) } : {}),
      }];
    });
    return {
      incomes: incomeItems,
      lines: planLines,
      repeatMonthly,
      repeatFrom: repeatMonthly ? shiftMonth(month, 1) : null,
    };
  };

  const validate = (values: SetupForm) => {
    const income = values.incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    for (const item of values.incomes) {
      const amount = Number(item.amount);
      const day = item.day.trim() === '' ? null : Number(item.day);
      if (!item.name.trim() || !isEarnedIncomeCategory(item.category)
        || !Number.isFinite(amount) || amount <= 0
        || (day !== null && (!Number.isInteger(day) || day < 1 || day > 31))) {
        Alert.alert('Check your budget', 'Enter an income name, a valid amount, and an optional day from 1 to 31.');
        return false;
      }
    }
    for (const line of values.lines) {
      if (line.category === 'EMI' || line.category === 'Insurance' || line.value.trim() === '') continue;
      const value = Number(line.value);
      if (!Number.isFinite(value) || value < 0
        || (line.mode === 'percent' && (value > 100 || income <= 0))
        || (line.dueDay.trim() !== ''
          && (!Number.isInteger(Number(line.dueDay)) || Number(line.dueDay) < 1 || Number(line.dueDay) > 31))) {
        Alert.alert('Check your budget', 'Enter valid amounts, percentages up to 100%, and due days from 1 to 31.');
        return false;
      }
    }
    return true;
  };

  const saveOnly = (values: SetupForm) => {
    if (submitting.current || !validate(values)) return;
    submitting.current = true;
    try {
      actions.saveBudgetPlan(planFromValues(values));
      const error = useAppStore.getState().lastError;
      if (error) Alert.alert('Could not save budget plan', error);
      else router.back();
    } finally {
      submitting.current = false;
    }
  };

  const apply = async (values: SetupForm) => {
    if (submitting.current || !validate(values)) return;
    const previousPlan = data.budgetPlan;
    const previous = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    if (previous) {
      const confirmed = await confirmAsync({
        title: 'Replace this month’s budget?',
        message: 'Payments already recorded stay.',
        confirmLabel: 'Replace',
      });
      if (!confirmed) return;
    }
    submitting.current = true;
    try {
      actions.saveAndApplyBudgetPlan(planFromValues(values), month);
      const error = useAppStore.getState().lastError;
      if (error) {
        Alert.alert('Could not apply budget plan', error);
        return;
      }
      const plannedCount = pendingItems(useAppStore.getState().data, month, today)
        .filter((item) => item.kind === 'budget').length;
      setActionToast({
        message: `Budget applied: ${plannedCount} planned items are in Transactions as due payments`,
        actionLabel: 'Undo',
        onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previous),
      });
      router.back();
    } finally {
      submitting.current = false;
    }
  };

  const startSuggestedSplit = async () => {
    const confirmed = await confirmAsync({
      title: 'Start from suggested split?',
      message: 'This replaces the current plan lines with a suggested five-group split.',
      confirmLabel: 'Replace lines',
    });
    if (!confirmed) return;
    if (plannedIncome === null || !Number.isFinite(plannedIncome) || plannedIncome <= 0) {
      Alert.alert('Add planned income', 'Add income before starting from the suggested split.');
      return;
    }
    const suggestion = suggestBudgetSplit({
      plannedIncome,
      commitments: monthlyCommitments(data, month),
    });
    const byCategory = new Map(suggestion.lines.map((line) => [line.category, line.planned]));
    lines.forEach((line, index) => {
      const amount = byCategory.get(line.category);
      if (amount !== undefined) {
        setValue(`lines.${index}.mode`, 'amount');
        setValue(`lines.${index}.value`, String(amount));
      }
    });
  };

  return (
    <FormScreen
      title="Budget plan"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={(
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText>Repeat every month from next month</AppText>
            <Switch value={repeatMonthly} onValueChange={setRepeatMonthly} accessibilityLabel="Repeat every month from next month" />
          </View>
          <Button label={`Apply to ${formatMonth(month)}`} icon="check" variant="primary"
            disabled={isSubmitting} onPress={() => { if (!submitting.current) void handleSubmit(apply)(); }} />
          <Button label="Save only" icon="save" disabled={isSubmitting}
            onPress={() => { if (!submitting.current) void handleSubmit(saveOnly)(); }} />
        </View>
      )}>
      <View style={{ gap: 12 }}>
        <AppText weight="semibold">Income</AppText>
        {incomes.map((income, index) => (
          <View key={income.id} style={{ gap: 8 }}>
            <Controller control={control} name={`incomes.${index}.name`} render={({ field }) => (
              <TextField label="Name" accessibilityLabel={`Income ${index + 1} name`} value={field.value}
                onChangeText={field.onChange} onBlur={field.onBlur} maxLength={40} />
            )} />
            <Controller control={control} name={`incomes.${index}.amount`} render={({ field }) => (
              <MoneyField label="Amount" accessibilityLabel={`Income ${index + 1} amount`} value={field.value}
                onChangeText={field.onChange} onBlur={field.onBlur} />
            )} />
            <Controller control={control} name={`incomes.${index}.day`} render={({ field }) => (
              <IntegerField label="Day (optional)" accessibilityLabel={`Income ${index + 1} day`} value={field.value}
                onChangeText={field.onChange} onBlur={field.onBlur} />
            )} />
            <Controller control={control} name={`incomes.${index}.category`} render={({ field }) => (
              <ChoiceField label="Category" value={field.value} choices={EARNED_INCOME_CATEGORIES}
                onChange={field.onChange} />
            )} />
            <Button label="Remove income" icon="x" variant="danger-text"
              onPress={() => setValue('incomes', incomes.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true })} />
          </View>
        ))}
        <Button label="Add income" onPress={() => {
          let index = incomes.length + 1;
          while (incomes.some((income) => income.id === `income-${index}`)) index += 1;
          setValue('incomes', [...incomes, {
            id: `income-${index}`,
            name: '',
            category: 'Salary',
            amount: '',
            day: '',
          }], { shouldDirty: true });
        }} />
        <Button label="Start from suggested split" onPress={() => void startSuggestedSplit()} />
      </View>
      <FormErrorBanner message={lastError} />
      <BudgetCategorySections
        groups={BUDGET_GROUPS}
        summarizeGroup={(group) => {
          const own = group.categories.reduce((total, category) => {
            const index = BUDGET_CATEGORIES.findIndex((candidate) => candidate === category);
            const line = lines[index];
            const value = Number(line?.value) || 0;
            return total + (line?.mode === 'percent' ? value * (plannedIncome ?? 0) / 100 : value);
          }, 0);
          const automatic = linkedRows.filter((row) => group.categories.some((category) => category === row.category))
            .reduce((total, row) => total + row.amount, 0);
          const amount = own + automatic;
          return { amount, percent: plannedIncome && plannedIncome > 0 ? amount / plannedIncome * 100 : 0 };
        }}
        renderCategory={(category) => {
          const index = BUDGET_CATEGORIES.findIndex((candidate) => candidate === category);
          const rows = linkedRows.filter((row) => row.category === category);
          const automaticAmount = rows.reduce((total, row) => total + row.amount, 0);
          const group = BUDGET_GROUPS.find((candidate) => candidate.categories.includes(category));
          const groupRows = linkedRows.filter((row) => group?.categories.includes(row.category));
          const linkedItems = group?.categories[0] === category && groupRows.length > 0 ? (
            <View style={{ gap: 4 }}>
              <AppText weight="semibold">Linked recurring items</AppText>
              {groupRows.map((row) => (
                <AppText key={row.id}>
                  {row.name} · {row.category} · {formatAmount(row.amount, 'exact', 1)} · {row.dueDate}
                </AppText>
              ))}
              <AppText>
                These come from your assets, liabilities and insurance. Change them there.
              </AppText>
            </View>
          ) : null;
          if (category === 'EMI' || category === 'Insurance') {
            return (
              <View key={category} style={{ gap: 6 }}>
                <AppText weight="semibold">{category} · Automatic</AppText>
                <AppText>{formatAmount(automaticAmount, 'exact', 1)} this month</AppText>
                {linkedItems}
              </View>
            );
          }
          const line = lines[index];
          return (
            <View key={category} style={{ gap: 6 }}>
              <AppText weight="semibold">{category}</AppText>
              <Controller control={control} name={`lines.${index}.mode`} render={({ field }) => (
                <SegmentedControl value={field.value} options={[
                  { label: 'Amount (₹)', value: 'amount' },
                  { label: '% of income', value: 'percent' },
                ]} size="compact" onChange={field.onChange} />
              )} />
              <Controller control={control} name={`lines.${index}.value`} render={({ field }) => field.value !== undefined && line?.mode === 'percent'
                ? <PercentField label="Enter percentage" accessibilityLabel={`${category} percentage`} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} size="compact" />
                : <MoneyField label="Enter amount" accessibilityLabel={`${category} amount`} value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} size="compact" />
              } />
              {line && line.value.trim() !== '' ? (
                <Controller control={control} name={`lines.${index}.dueDay`} render={({ field }) => (
                  <IntegerField label="Due day" accessibilityLabel={`${category} due day`} value={field.value}
                    onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
              ) : null}
              {category.includes('invest') || category === 'Stocks / ETF' || category === 'Fixed deposit / RD'
                || category === 'Gold / Silver' || category === 'Other investments'
                ? <AppText>Recurring plans (automatic): {formatAmount(automaticAmount, 'exact', 1)}</AppText>
                : null}
              {linkedItems}
            </View>
          );
        }}
      />
    </FormScreen>
  );
}
